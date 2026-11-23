import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Cart, { ICart } from '../models/Cart';
import Book from '../models/Book';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Función auxiliar para limpiar items huérfanos, calcular totales y formatear respuesta
 */
const formatAndCalculateCart = async (cart: any) => {
  // 1. Poblamos la información pública del libro (sin digitalFile)
  await cart.populate('items.book', 'title author category price stock availability coverImage');

  // 2. Limpieza automática de ítems cuyo libro fue eliminado de la base de datos
  const originalCount = cart.items.length;
  cart.items = cart.items.filter((item: any) => item.book !== null && item.book !== undefined);

  if (cart.items.length !== originalCount) {
    await cart.save();
  }

  // 3. Cálculo de totalItems y subtotal
  const totalItems = cart.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
  const rawSubtotal = cart.items.reduce((sum: number, item: any) => {
    const price = item.book?.price ? Number(item.book.price) : 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const subtotal = Number(rawSubtotal.toFixed(2));

  return {
    items: cart.items,
    totalItems,
    subtotal
  };
};

/**
 * @desc    Obtener el carrito activo del usuario autenticado
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (
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

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const { items, totalItems, subtotal } = await formatAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      items,
      totalItems,
      subtotal,
      data: {
        items,
        totalItems,
        subtotal
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Agregar un libro al carrito o incrementar su cantidad
 * @route   POST /api/cart/items
 * @access  Private
 */
export const addItemToCart = async (
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

    const { bookId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(404).json({ success: false, message: 'ID de libro no válido o no proporcionado.' });
      return;
    }

    if (isNaN(qty) || qty < 1) {
      res.status(400).json({
        success: false,
        message: 'La cantidad a agregar debe ser un número entero mayor o igual a 1.'
      });
      return;
    }

    // 1. Verificar existencia del libro
    const book: any = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, message: 'Libro no encontrado en el catálogo.' });
      return;
    }

    // 2. Verificar disponibilidad y stock
    if (!book.availability || book.stock <= 0) {
      res.status(400).json({
        success: false,
        message: `El libro "${book.title}" se encuentra actualmente agotado.`
      });
      return;
    }

    // 3. Buscar o crear el carrito del usuario
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // 4. Comprobar si el libro ya está en el carrito
    const itemIndex = cart.items.findIndex(
      (item: any) => item.book.toString() === bookId.toString()
    );

    let targetQuantity = qty;
    if (itemIndex > -1) {
      targetQuantity = cart.items[itemIndex].quantity + qty;
    }

    // 5. Validar que la cantidad total no supere el stock disponible
    if (targetQuantity > book.stock) {
      res.status(400).json({
        success: false,
        message: `No se puede agregar esa cantidad. El stock máximo disponible para "${book.title}" es de ${book.stock} unidades.`
      });
      return;
    }

    // 6. Actualizar o insertar item
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = targetQuantity;
    } else {
      cart.items.push({
        book: book._id,
        quantity: targetQuantity
      } as any);
    }

    await cart.save();

    const { items, totalItems, subtotal } = await formatAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Libro agregado al carrito exitosamente.',
      items,
      totalItems,
      subtotal,
      data: {
        items,
        totalItems,
        subtotal
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar la cantidad de un ítem en el carrito
 * @route   PUT /api/cart/items/:bookId
 * @access  Private
 */
export const updateCartItem = async (
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

    const { bookId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId as string)) {
      res.status(404).json({ success: false, message: 'ID de libro no válido.' });
      return;
    }

    if (quantity === undefined || isNaN(qty)) {
      res.status(400).json({ success: false, message: 'Debes proporcionar una cantidad numérica válida.' });
      return;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Si quantity <= 0, se elimina el ítem del carrito
    if (qty <= 0) {
      cart.items = cart.items.filter(
        (item: any) => item.book.toString() !== (bookId as string).toString()
      );
      await cart.save();

      const { items, totalItems, subtotal } = await formatAndCalculateCart(cart);

      res.status(200).json({
        success: true,
        message: 'Ítem eliminado del carrito.',
        items,
        totalItems,
        subtotal,
        data: {
          items,
          totalItems,
          subtotal
        }
      });
      return;
    }

    // Validar existencia y stock del libro
    const book: any = await Book.findById(bookId);
    if (!book) {
      // Si el libro ya no existe en el catálogo, lo retiramos del carrito
      cart.items = cart.items.filter(
        (item: any) => item.book.toString() !== (bookId as string).toString()
      );
      await cart.save();
      res.status(404).json({ success: false, message: 'Libro no encontrado en el catálogo.' });
      return;
    }

    if (qty > book.stock) {
      res.status(400).json({
        success: false,
        message: `La cantidad solicitada supera el stock disponible. El stock máximo disponible para "${book.title}" es de ${book.stock} unidades.`
      });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.book.toString() === (bookId as string).toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
    } else {
      cart.items.push({
        book: book._id,
        quantity: qty
      } as any);
    }

    await cart.save();

    const { items, totalItems, subtotal } = await formatAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Cantidad de carrito actualizada correctamente.',
      items,
      totalItems,
      subtotal,
      data: {
        items,
        totalItems,
        subtotal
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un libro específico del carrito
 * @route   DELETE /api/cart/items/:bookId
 * @access  Private
 */
export const removeCartItem = async (
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

    const { bookId } = req.params;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    cart.items = cart.items.filter(
      (item: any) => item.book.toString() !== (bookId as string).toString()
    );

    await cart.save();

    const { items, totalItems, subtotal } = await formatAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Libro removido del carrito exitosamente.',
      items,
      totalItems,
      subtotal,
      data: {
        items,
        totalItems,
        subtotal
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vaciar completamente el carrito de compras
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = async (
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

    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Carrito vaciado exitosamente.',
      items: [],
      totalItems: 0,
      subtotal: 0,
      data: {
        items: [],
        totalItems: 0,
        subtotal: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
