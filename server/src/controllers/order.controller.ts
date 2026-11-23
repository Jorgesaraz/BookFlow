import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order, { IOrder } from '../models/Order';
import Cart from '../models/Cart';
import Book from '../models/Book';
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
        const { getIO } = require('../config/socket');
        const io = getIO();
        if (io) {
          io.to('admin_room').emit('order:created', order);
          io.to(`user_${userId}`).emit('order:updated', order);
        }
      } catch (e) {
        // Socket opcional
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

export default {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint
};
