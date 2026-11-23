const Order = require('../models/Order');
const Book = require('../models/Book');
const { createPayPalOrder, capturePayPalOrder } = require('../config/paypal');
const { getIO } = require('../config/socket');

// @desc    Crear orden de pago en PayPal Sandbox
// @route   POST /api/payments/paypal/create-order
// @access  Private/Client
const createPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ success: false, message: `El pedido ya está en estado ${order.status}` });
    }

    // Crear orden con la API de PayPal Sandbox
    const paypalOrder = await createPayPalOrder(order._id, order.totalPrice, 'USD');

    res.json({
      success: true,
      paypalOrderId: paypalOrder.id,
      data: paypalOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Capturar pago completado de PayPal y actualizar pedido
// @route   POST /api/payments/paypal/capture-order
// @access  Private/Client
const capturePayment = async (req, res, next) => {
  try {
    const { orderId, paypalOrderId } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    if (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'PROCESSING') {
      return res.json({ success: true, message: 'El pedido ya fue pagado con anterioridad', data: order });
    }

    // Capturar el pago en PayPal
    const captureData = await capturePayPalOrder(paypalOrderId);

    if (captureData.status === 'COMPLETED') {
      order.status = 'PAID';
      order.paidAt = new Date();
      order.paymentResult = {
        id: captureData.id,
        status: captureData.status,
        update_time: captureData.update_time || new Date().toISOString(),
        email_address: captureData.payer?.email_address || 'buyer@sandbox.com'
      };

      order.statusHistory.push({
        status: 'PAID',
        changedAt: new Date(),
        comment: `Pago completado exitosamente vía PayPal Sandbox. ID: ${captureData.id}`
      });

      const updatedOrder = await order.save();

      // Reducir stock de cada libro en el inventario
      const io = getIO();
      for (const item of order.items) {
        const book = await Book.findById(item.book);
        if (book) {
          book.stock = Math.max(0, book.stock - item.quantity);
          await book.save();

          if (io) {
            io.emit('book:stock_updated', {
              bookId: book._id,
              stock: book.stock,
              title: book.title
            });
          }
        }
      }

      // Notificar al Kanban administrativo y al cliente en tiempo real
      if (io) {
        io.to('admin_room').emit('order:status_updated', {
          orderId: updatedOrder._id,
          status: updatedOrder.status,
          order: updatedOrder
        });

        io.to(`user_${order.user._id}`).emit('order:status_updated', {
          orderId: updatedOrder._id,
          status: updatedOrder.status,
          order: updatedOrder
        });
      }

      return res.json({
        success: true,
        message: 'Pago confirmado y pedido actualizado a PAID',
        data: updatedOrder
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Estado de pago no completado: ${captureData.status}`
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  capturePayment
};
