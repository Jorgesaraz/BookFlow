const Order = require('../models/Order');
const Book = require('../models/Book');
const { getIO } = require('../config/socket');

// @desc    Crear un nuevo pedido preliminar
// @route   POST /api/orders
// @access  Private/Client
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, itemsPrice, shippingPrice, totalPrice } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'El carrito no contiene artículos' });
    }

    // Validar existencia y stock de libros
    for (const item of items) {
      const book = await Book.findById(item.book);
      if (!book) {
        return res.status(404).json({ success: false, message: `El libro "${item.title}" no existe` });
      }
      if (book.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${book.title}". Stock disponible: ${book.stock}`
        });
      }
    }

    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      itemsPrice,
      shippingPrice: shippingPrice || 0,
      totalPrice,
      status: 'PENDING_PAYMENT',
      statusHistory: [{
        status: 'PENDING_PAYMENT',
        changedAt: new Date(),
        comment: 'Pedido generado, pendiente de pago'
      }]
    });

    const createdOrder = await order.save();
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('user', 'name email');

    // Notificar a los administradores vía Socket.IO (Kanban en tiempo real)
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('order:created', populatedOrder);
    }

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener pedidos del cliente autenticado
// @route   GET /api/orders/my-orders
// @access  Private/Client
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un pedido por ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    // Validar que el usuario sea el dueño de la orden o un ADMIN
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'No tienes autorización para ver este pedido' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todos los pedidos (para el Tablero Kanban de Administración)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar el estado de un pedido (mover tarjeta en Kanban)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const validStatuses = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Estado no válido. Opciones: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    const prevStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      comment: comment || `Estado cambiado por administrador de ${prevStatus} a ${status}`
    });

    if (status === 'COMPLETED' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    // Notificar en tiempo real vía Socket.IO
    const io = getIO();
    if (io) {
      // Notificar a todos los administradores en el Kanban
      io.to('admin_room').emit('order:status_updated', {
        orderId: updatedOrder._id,
        status: updatedOrder.status,
        order: updatedOrder
      });

      // Notificar al cliente específico para actualizar su pantalla en vivo
      io.to(`user_${order.user._id}`).emit('order:status_updated', {
        orderId: updatedOrder._id,
        status: updatedOrder.status,
        order: updatedOrder
      });
    }

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatus
};
