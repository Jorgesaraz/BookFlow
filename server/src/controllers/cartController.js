const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Book = require('../models/Book');

/**
 * Función auxiliar para limpiar items huérfanos, calcular totales y formatear respuesta
 */
const formatAndCalculateCart = async (cart) => {
  // 1. Poblamos la información pública del libro (sin digitalFile)
  await cart.populate('items.book', 'title author category price stock availability coverImage');

  // 2. Limpieza automática de ítems cuyo libro fue eliminado de la base de datos
  const originalCount = cart.items.length;
  cart.items = cart.items.filter((item) => item.book !== null && item.book !== undefined);

  if (cart.items.length !== originalCount) {
    await cart.save();
  }

  // 3. Cálculo de totalItems y subtotal
  const totalItems = cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const rawSubtotal = cart.items.reduce((sum, item) => {
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

// @desc    Obtener el carrito activo del usuario autenticado
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
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

// @desc    Agregar un libro al carrito o incrementar su cantidad
// @route   POST /api/cart/items
// @access  Private
const addItemToCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const { bookId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(404).json({ success: false, message: 'ID de libro no válido o no proporcionado.' });
    }

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad a agregar debe ser un número entero mayor o igual a 1.'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Libro no encontrado en el catálogo.' });
    }

    if (!book.availability || book.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: `El libro "${book.title}" se encuentra actualmente agotado.`
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.book.toString() === bookId.toString()
    );

    let targetQuantity = qty;
    if (itemIndex > -1) {
      targetQuantity = cart.items[itemIndex].quantity + qty;
    }

    if (targetQuantity > book.stock) {
      return res.status(400).json({
        success: false,
        message: `No se puede agregar esa cantidad. El stock máximo disponible para "${book.title}" es de ${book.stock} unidades.`
      });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = targetQuantity;
    } else {
      cart.items.push({
        book: book._id,
        quantity: targetQuantity
      });
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

// @desc    Actualizar la cantidad de un ítem en el carrito
// @route   PUT /api/cart/items/:bookId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const { bookId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(404).json({ success: false, message: 'ID de libro no válido.' });
    }

    if (quantity === undefined || isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Debes proporcionar una cantidad numérica válida.' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    if (qty <= 0) {
      cart.items = cart.items.filter(
        (item) => item.book.toString() !== bookId.toString()
      );
      await cart.save();

      const { items, totalItems, subtotal } = await formatAndCalculateCart(cart);

      return res.status(200).json({
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
    }

    const book = await Book.findById(bookId);
    if (!book) {
      cart.items = cart.items.filter(
        (item) => item.book.toString() !== bookId.toString()
      );
      await cart.save();
      return res.status(404).json({ success: false, message: 'Libro no encontrado en el catálogo.' });
    }

    if (qty > book.stock) {
      return res.status(400).json({
        success: false,
        message: `La cantidad solicitada supera el stock disponible. El stock máximo disponible para "${book.title}" es de ${book.stock} unidades.`
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.book.toString() === bookId.toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
    } else {
      cart.items.push({
        book: book._id,
        quantity: qty
      });
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

// @desc    Eliminar un libro específico del carrito
// @route   DELETE /api/cart/items/:bookId
// @access  Private
const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    const { bookId } = req.params;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    cart.items = cart.items.filter(
      (item) => item.book.toString() !== bookId.toString()
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

// @desc    Vaciar completamente el carrito de compras
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
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

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
