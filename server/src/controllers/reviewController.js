const mongoose = require('mongoose');
const Review = require('../models/Review');
const Book = require('../models/Book');
const Order = require('../models/Order');

/**
 * Función auxiliar para recalcular averageRating y numReviews de un libro
 */
const recalculateBookRating = async (bookId) => {
  try {
    const reviews = await Review.find({ book: bookId });
    if (reviews.length === 0) {
      await Book.findByIdAndUpdate(bookId, { averageRating: 0, numReviews: 0 });
    } else {
      const numReviews = reviews.length;
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = Number((sum / numReviews).toFixed(1));
      await Book.findByIdAndUpdate(bookId, { averageRating, numReviews });
    }
  } catch (err) {
    console.error(`[Review] Error recalculando rating para libro ${bookId}:`, err.message);
  }
};

// @desc    Obtener todas las reseñas de un libro
// @route   GET /api/reviews/book/:bookId
// @access  Public
const getBookReviewsEndpoint = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(404).json({
        success: false,
        message: 'ID de libro no válido.'
      });
    }

    const reviews = await Review.find({ book: bookId })
      .sort({ createdAt: -1 })
      .populate('user', 'name');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear una reseña verificada para un libro
// @route   POST /api/reviews/book/:bookId
// @access  Private
const createReviewEndpoint = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(404).json({ success: false, message: 'ID de libro no válido.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'El libro solicitado no existe.' });
    }

    // 1. Validar que el usuario haya comprado el e-book (orden COMPLETED)
    const hasPurchased = await Order.findOne({
      user: userId,
      status: 'COMPLETED',
      'items.book': bookId
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Debes adquirir este e-book antes de escribir una reseña'
      });
    }

    // 2. Verificar si ya dejó reseña para este libro
    const existingReview = await Review.findOne({ book: bookId, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para este e-book.'
      });
    }

    const numRating = Number(rating);
    if (!rating || isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación es obligatoria y debe ser un número entero entre 1 y 5.'
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El comentario de la reseña es obligatorio.'
      });
    }

    const review = await Review.create({
      user: userId,
      book: bookId,
      rating: Math.round(numRating),
      comment: comment.trim(),
      verifiedPurchase: true
    });

    await recalculateBookRating(bookId);
    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Reseña agregada exitosamente.',
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para este e-book.'
      });
    }
    next(error);
  }
};

// @desc    Eliminar una reseña (solo autor o ADMIN)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReviewEndpoint = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'ID de reseña no válido.' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Reseña no encontrada.' });
    }

    if (review.user.toString() !== userId?.toString() && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta reseña.'
      });
    }

    const bookId = review.book;
    await Review.findByIdAndDelete(id);

    await recalculateBookRating(bookId);

    res.status(200).json({
      success: true,
      message: 'Reseña eliminada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recalculateBookRating,
  getBookReviewsEndpoint,
  createReviewEndpoint,
  deleteReviewEndpoint
};
