const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { createPayPalOrder, capturePayPalOrder } = require('../services/paypalService');

// @desc    Crear una orden de PayPal Sandbox basada en el carrito del usuario
// @route   POST /api/orders/create-paypal-order
// @access  Private
const createPayPalOrderEndpoint = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.book');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito de compras está vacío. Agrega libros antes de pagar.'
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const book = item.book;
      if (!book) {
        return res.status(400).json({
          success: false,
          message: 'Uno de los libros de tu carrito ya no existe en el catálogo.'
        });
      }

      if (!book.availability || book.stock <= 0) {
        return res.status(400).json({
          success: false,
          message: `El libro "${book.title}" se encuentra agotado.`
        });
      }

      if (book.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${book.title}". Stock disponible: ${book.stock}`
        });
      }

      const itemPrice = Number(book.price);
      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        book: book._id,
        title: book.title,
        price: itemPrice,
        quantity: item.quantity
      });
    }

    totalAmount = Number(totalAmount.toFixed(2));

    const paypalOrder = await createPayPalOrder(totalAmount);
    if (!paypalOrder || !paypalOrder.id) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo generar la orden de pago en PayPal Sandbox.'
      });
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
      paypalOrderId: paypalOrder.id
    });

    res.status(201).json({
      success: true,
      paypalOrderId: paypalOrder.id,
      orderId: order._id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Capturar y confirmar el pago de PayPal Sandbox
// @route   POST /api/orders/capture-paypal-order
// @access  Private
const capturePayPalOrderEndpoint = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const { paypalOrderId } = req.body;
    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: 'El identificador paypalOrderId es obligatorio.'
      });
    }

    const order = await Order.findOne({ paypalOrderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada o no pertenece al usuario autenticado.'
      });
    }

    if (order.status === 'COMPLETED') {
      return res.status(200).json({
        success: true,
        message: 'La orden ya ha sido completada previamente.',
        order
      });
    }

    const captureData = await capturePayPalOrder(paypalOrderId);

    if (captureData && captureData.status === 'COMPLETED') {
      const captureId =
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || captureData.id;

      order.status = 'COMPLETED';
      order.paypalCaptureId = captureId;
      order.paidAt = new Date();
      await order.save();

      for (const item of order.items) {
        const book = await Book.findById(item.book);
        if (book) {
          book.stock = Math.max(0, book.stock - item.quantity);
          book.availability = book.stock > 0;
          await book.save();
        }
      }

      await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

      try {
        const { getIO } = require('../socket/socket');
        const io = getIO();

        // 1. Notificar a admins: nueva orden
        const User = require('../models/User');
        const orderUser = await User.findById(userId).select('email');
        io.to('admin-room').emit('new-order', {
          orderId: order._id,
          totalAmount: order.totalAmount,
          customerEmail: orderUser?.email || 'unknown',
          itemsCount: order.items.length,
          createdAt: order.createdAt || new Date()
        });

        // 2. Por cada libro: stock-updated global + low-stock-alert a admin
        for (const item of order.items) {
          const updatedBook = await Book.findById(item.book);
          if (updatedBook) {
            io.emit('stock-updated', {
              bookId: updatedBook._id.toString(),
              stock: updatedBook.stock,
              availability: updatedBook.availability
            });
            if (updatedBook.stock <= 2) {
              io.to('admin-room').emit('low-stock-alert', {
                bookId: updatedBook._id.toString(),
                title: updatedBook.title,
                stock: updatedBook.stock,
                availability: updatedBook.availability
              });
            }
          }
        }
      } catch (e) {
        console.warn('[Socket.IO] Error emitting events:', e.message);
      }

      res.status(200).json({
        success: true,
        message: 'Pago completado exitosamente',
        order
      });
    } else {
      order.status = 'FAILED';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'No se pudo capturar el pago en PayPal Sandbox. Estado no completado.',
        details: captureData
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener historial de compras del usuario con digitalFile accesible
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrdersEndpoint = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const orders = await Order.find({ user: userId, status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.book',
        select: 'title author coverImage category +digitalFile'
      });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener detalle de una orden por ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderByIdEndpoint = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'ID de orden no válido.' });
    }

    const order = await Order.findById(id).populate({
      path: 'items.book',
      select: 'title author coverImage category +digitalFile'
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
    }

    if (order.user.toString() !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver esta orden.' });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint
};
