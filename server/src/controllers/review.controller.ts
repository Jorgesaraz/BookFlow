import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Book from '../models/Book';
import Order from '../models/Order';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Función auxiliar para recalcular averageRating y numReviews de un libro
 */
export const recalculateBookRating = async (bookId: string | mongoose.Types.ObjectId): Promise<void> => {
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
  } catch (err: any) {
    console.error(`[Review] Error recalculando rating para libro ${bookId}:`, err.message);
  }
};

/**
 * @desc    Obtener todas las reseñas de un libro
 * @route   GET /api/reviews/book/:bookId
 * @access  Public
 */
export const getBookReviewsEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId as string)) {
      res.status(404).json({
        success: false,
        message: 'ID de libro no válido.'
      });
      return;
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

/**
 * @desc    Crear una reseña verificada para un libro
 * @route   POST /api/reviews/book/:bookId
 * @access  Private
 */
export const createReviewEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { bookId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(bookId as string)) {
      res.status(404).json({ success: false, message: 'ID de libro no válido.' });
      return;
    }

    // 1. Verificar existencia del libro
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ success: false, message: 'El libro solicitado no existe.' });
      return;
    }

    // 2. Validar que el usuario haya comprado el e-book (orden COMPLETED con este bookId)
    const hasPurchased = await Order.findOne({
      user: userId,
      status: 'COMPLETED',
      'items.book': bookId
    });

    if (!hasPurchased) {
      res.status(403).json({
        success: false,
        message: 'Debes adquirir este e-book antes de escribir una reseña'
      });
      return;
    }

    // 3. Verificar si ya dejó reseña para este libro
    const existingReview = await Review.findOne({ book: bookId, user: userId });
    if (existingReview) {
      res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para este e-book.'
      });
      return;
    }

    // 4. Validar campos de calificación y comentario
    const numRating = Number(rating);
    if (!rating || isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({
        success: false,
        message: 'La calificación es obligatoria y debe ser un número entero entre 1 y 5.'
      });
      return;
    }

    if (!comment || !comment.trim()) {
      res.status(400).json({
        success: false,
        message: 'El comentario de la reseña es obligatorio.'
      });
      return;
    }

    // 5. Crear la reseña verificada
    const review = await Review.create({
      user: userId,
      book: bookId,
      rating: Math.round(numRating),
      comment: comment.trim(),
      verifiedPurchase: true
    });

    // 6. Recalcular rating y reviews del libro
    await recalculateBookRating(bookId as string);

    // 7. Poblar datos del usuario para la respuesta
    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Reseña agregada exitosamente.',
      data: review
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para este e-book.'
      });
      return;
    }
    next(error);
  }
};

/**
 * @desc    Eliminar una reseña (solo autor o ADMIN)
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReviewEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      res.status(404).json({ success: false, message: 'ID de reseña no válido.' });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Reseña no encontrada.' });
      return;
    }

    // Permitir eliminar solo al autor o a un ADMIN
    if (review.user.toString() !== userId?.toString() && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta reseña.'
      });
      return;
    }

    const bookId = review.book;
    await Review.findByIdAndDelete(id);

    // Recalcular métricas del libro
    await recalculateBookRating(bookId);

    res.status(200).json({
      success: true,
      message: 'Reseña eliminada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  recalculateBookRating,
  getBookReviewsEndpoint,
  createReviewEndpoint,
  deleteReviewEndpoint
};
