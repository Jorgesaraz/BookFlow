import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order, { IOrder } from '../models/Order';
import Cart from '../models/Cart';
import Book from '../models/Book';
import User from '../models/User';
import { createPayPalOrder, capturePayPalOrder } from '../services/paypal.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * @desc    Crear una orden de PayPal Sandbox basada en el carrito del usuario
 * @route   POST /api/orders/create-paypal-order
 * @access  Private
 */
export const createPayPalOrderEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      return;
    }

    // 1. Obtener el carrito real del usuario desde la base de datos
    const cart: any = await Cart.findOne({ user: userId }).populate('items.book');
    if (!cart || !cart.items || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'El carrito de compras está vacío. Agrega libros antes de pagar.'
      });
      return;
    }

    // 2. Validar disponibilidad y stock de cada libro en el servidor
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of cart.items) {
      const book = item.book;
      if (!book) {
        res.status(400).json({
          success: false,
          message: 'Uno de los libros de tu carrito ya no existe en el catálogo.'
        });
        return;
      }

      if (!book.availability || book.stock <= 0) {
        res.status(400).json({
          success: false,
          message: `El libro "${book.title}" se encuentra agotado.`
        });
        return;
      }

      if (book.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${book.title}". Stock disponible: ${book.stock}`
        });
        return;
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

    // 3. Crear la orden en PayPal Sandbox
    const paypalOrder = await createPayPalOrder(totalAmount);
    if (!paypalOrder || !paypalOrder.id) {
      res.status(500).json({
        success: false,
        message: 'No se pudo generar la orden de pago en PayPal Sandbox.'
      });
      return;
    }

    // 4. Guardar orden pendiente en la base de datos
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

/**
 * @desc    Capturar y confirmar el pago de PayPal Sandbox
 * @route   POST /api/orders/capture-paypal-order
 * @access  Private
 */
export const capturePayPalOrderEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      return;
    }

    const { paypalOrderId } = req.body;
    if (!paypalOrderId) {
      res.status(400).json({
        success: false,
        message: 'El identificador paypalOrderId es obligatorio.'
      });
      return;
    }

    // 1. Buscar la orden asociada al usuario autenticado
    const order: any = await Order.findOne({ paypalOrderId, user: userId });
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Orden no encontrada o no pertenece al usuario autenticado.'
      });
      return;
    }

    // Idempotencia: si ya estaba completada, responder de inmediato
    if (order.status === 'COMPLETED') {
      res.status(200).json({
        success: true,
        message: 'La orden ya ha sido completada previamente.',
        order
      });
      return;
    }

    // 2. Capturar el pago con PayPal Sandbox
    const captureData = await capturePayPalOrder(paypalOrderId);

    if (captureData && captureData.status === 'COMPLETED') {
      const captureId =
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || captureData.id;

      // 3.1 Actualizar estado de la orden a COMPLETED
      order.status = 'COMPLETED';
      order.paypalCaptureId = captureId;
      order.paidAt = new Date();
      await order.save();

      // 3.2 Descontar stock de cada libro comprado y recalcular availability
      for (const item of order.items) {
        const book: any = await Book.findById(item.book);
        if (book) {
          book.stock = Math.max(0, book.stock - item.quantity);
          book.availability = book.stock > 0;
          await book.save();
        }
      }

      // 3.3 Vaciar el carrito de compras del usuario
      await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

      // 3.4 Notificación en tiempo real vía Socket.IO
      try {
        const { getIO } = require('../socket/socket');
        const io = getIO();

        // 1. Notificar a admins: nueva orden
        const User = require('../models/User');
        const orderUser: any = await User.findById(userId).select('email');
        io.to('admin-room').emit('new-order', {
          orderId: order._id,
          totalAmount: order.totalAmount,
          customerEmail: orderUser?.email || 'unknown',
          itemsCount: order.items.length,
          createdAt: order.createdAt || new Date()
        });

        // 2. Por cada libro: stock-updated global + low-stock-alert a admin
        for (const item of order.items) {
          const updatedBook: any = await Book.findById(item.book);
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
      } catch (e: any) {
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

/**
 * @desc    Obtener historial de compras del usuario con digitalFile accesible
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrdersEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      return;
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

/**
 * @desc    Obtener detalle de una orden por ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderByIdEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(404).json({ success: false, message: 'ID de orden no válido.' });
      return;
    }

    const order = await Order.findById(id).populate({
      path: 'items.book',
      select: 'title author coverImage category +digitalFile'
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Orden no encontrada.' });
      return;
    }

    // Permitir acceso solo al dueño de la orden o a usuarios con rol ADMIN
    if (order.user.toString() !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No tienes permiso para ver esta orden.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener métricas y lista de órdenes para el Dashboard y Kanban de ADMIN
 * @route   GET /api/orders/admin/dashboard
 * @access  Private/Admin
 */
export const getAdminDashboardOrdersEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Obtener todas las órdenes ordenadas por fecha descendente
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    // 2. Calcular totalRevenue de órdenes COMPLETED (redondeado a 2 decimales)
    const completedOrdersList = orders.filter((o) => o.status === 'COMPLETED');
    const rawRevenue = completedOrdersList.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const totalRevenue = Number(rawRevenue.toFixed(2));

    // 3. Conteo de órdenes
    const completedOrders = completedOrdersList.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;

    // 4. Conteo de clientes (User con role === 'CLIENT')
    const totalClients = await User.countDocuments({ role: 'CLIENT' });

    // 5. Conteo de libros con stock bajo (stock <= 2)
    const lowStockBooks = await Book.countDocuments({ stock: { $lte: 2 } });

    const metrics = {
      totalRevenue,
      completedOrders,
      pendingOrders,
      totalClients,
      lowStockBooks
    };

    res.status(200).json({
      success: true,
      metrics,
      orders,
      data: {
        metrics,
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar estado de una orden (para drag-and-drop del Tablero Kanban)
 * @route   PATCH /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatusEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser PENDING, COMPLETED o FAILED.'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(404).json({
        success: false,
        message: 'ID de orden no válido.'
      });
      return;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!updatedOrder) {
      res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
      return;
    }

    // Emitir evento por Socket.IO a admin-room para sincronizar el tablero
    try {
      const { getIO } = require('../socket/socket');
      getIO().to('admin-room').emit('order-status-updated', updatedOrder);
    } catch (e: any) {
      console.warn('[Socket.IO] Error emitiendo order-status-updated:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Estado de la orden actualizado exitosamente.',
      data: updatedOrder,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint,
  getAdminDashboardOrdersEndpoint,
  updateOrderStatusEndpoint
};
