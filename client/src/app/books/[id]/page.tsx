'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useSocket } from '../../../context/SocketContext';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Zap,
  Download,
  X,
  Loader2,
  Check,
  Star,
  Trash2,
  MessageSquare,
  BadgeCheck,
  Send
} from 'lucide-react';

interface BookDetail {
  _id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  coverImage: string;
  availability: boolean;
  averageRating?: number;
  numReviews?: number;
  createdAt: string;
}

interface ReviewItem {
  _id: string;
  user?: {
    _id: string;
    name: string;
  };
  book: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToCart } = useCart();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Estados de Reseñas
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Cargar libro
  const fetchBook = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/books/${id}`);
      if (res.data.success) {
        setBook(res.data.data);
      } else {
        setError('No se pudo encontrar el libro solicitado.');
      }
    } catch (err: any) {
      console.error('Error cargando libro:', err);
      setError('El libro solicitado no existe o no está disponible.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Cargar reseñas del libro
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const res = await api.get(`/reviews/book/${id}`);
      if (res.data.success) {
        setReviews(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error cargando reseñas:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
    fetchReviews();
  }, [fetchBook, fetchReviews]);

  // Actualización de stock en tiempo real
  useEffect(() => {
    if (!socket || !id) return;

    const handleStockUpdate = (data: { bookId: string; stock: number; availability?: boolean }) => {
      if (data.bookId === id) {
        setBook((prev) =>
          prev
            ? {
                ...prev,
                stock: data.stock,
                availability: data.availability !== undefined ? data.availability : data.stock > 0
              }
            : prev
        );
      }
    };

    socket.on('stock-updated', handleStockUpdate);
    return () => {
      socket.off('stock-updated', handleStockUpdate);
    };
  }, [socket, id]);

  const handleAddToCart = async () => {
    if (!book || !book.availability || book.stock === 0 || isAdding) return;

    setIsAdding(true);
    const result = await addToCart(book._id, 1);
    setIsAdding(false);

    if (result.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2500);
      setToastMessage(`¡"${book.title}" agregado exitosamente al carrito!`);
      setTimeout(() => setToastMessage(null), 3500);
    } else if (result.message) {
      setToastMessage(result.message);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Crear reseña
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setReviewError('Por favor escribe un comentario para tu reseña.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await api.post(`/reviews/book/${id}`, {
        rating: newRating,
        comment: newComment.trim()
      });

      if (res.data.success) {
        setReviewSuccess('¡Tu reseña verificada ha sido publicada!');
        setNewComment('');
        setNewRating(5);
        // Agregar reseña al inicio
        const addedReview = res.data.data;
        setReviews((prev) => [addedReview, ...prev]);

        // Refrescar datos del libro para actualizar averageRating y numReviews
        const updatedReviews = [addedReview, ...reviews];
        const newNum = updatedReviews.length;
        const newAvg = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / newNum).toFixed(1));
        setBook((prev) => prev ? { ...prev, averageRating: newAvg, numReviews: newNum } : prev);

        setTimeout(() => setReviewSuccess(null), 5000);
      }
    } catch (err: any) {
      console.error('Error al enviar reseña:', err);
      if (err.response?.status === 403) {
        setReviewError('Debes adquirir este e-book antes de escribir una reseña.');
      } else {
        setReviewError(err.response?.data?.message || 'Error al publicar la reseña. Inténtalo de nuevo.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Eliminar reseña
  const handleDeleteReview = async (reviewId: string) => {
    const confirmDelete = window.confirm('¿Confirmas que deseas eliminar esta reseña?');
    if (!confirmDelete) return;

    setDeletingReviewId(reviewId);
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data.success) {
        const filtered = reviews.filter((r) => r._id !== reviewId);
        setReviews(filtered);
        const newNum = filtered.length;
        const newAvg = newNum > 0 ? Number((filtered.reduce((acc, r) => acc + r.rating, 0) / newNum).toFixed(1)) : 0;
        setBook((prev) => prev ? { ...prev, averageRating: newAvg, numReviews: newNum } : prev);
        setToastMessage('Reseña eliminada exitosamente.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Error al eliminar reseña:', err);
      alert(err.response?.data?.message || 'Error al eliminar la reseña.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32"></div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-[3/4] bg-slate-200 rounded-2xl w-full"></div>
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded w-24"></div>
              <div className="h-10 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-24 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Libro no encontrado</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          {error || 'El libro que estás buscando no existe en nuestro catálogo o fue retirado.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = !book.availability || book.stock === 0;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast Notificación Temporal */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Botón Volver */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Principal</span>
        </Link>

        {/* Tarjeta de Detalle Principal */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Columna Izquierda: Portada Grande */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative aspect-[3/4] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                {!imageError && book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-indigo-50 text-slate-400">
                    <BookOpen className="w-16 h-16 text-indigo-300 mb-2" />
                    <span className="text-sm font-semibold text-slate-600">{book.title}</span>
                  </div>
                )}

                {/* Badge de disponibilidad flotante */}
                <div className="absolute top-4 right-4">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                      <AlertCircle className="w-3.5 h-3.5" />
                      AGOTADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      DISPONIBLE ({book.stock} un.)
                    </span>
                  )}
                </div>
              </div>

              {/* Badges de garantía */}
              <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-3 text-[11px] text-slate-500 font-semibold">
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Formato E-Book PDF</span>
                </div>
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Compra Segura</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Información y Sinopsis */}
            <div className="md:col-span-7 space-y-6">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border border-indigo-100">
                    {book.category}
                  </span>

                  {/* 1. Calificación con Estrellas */}
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 px-3 py-1 rounded-full text-xs">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {book.numReviews && book.numReviews > 0 ? (
                      <span className="font-extrabold text-slate-800">
                        {(book.averageRating || 0).toFixed(1)}{' '}
                        <span className="text-slate-500 font-normal">({book.numReviews})</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-500">Sin reseñas</span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                  {book.title}
                </h1>

                <p className="text-sm sm:text-base font-medium text-slate-600">
                  Por <span className="font-bold text-slate-900">{book.author}</span>
                </p>
              </div>

              {/* Precio y Estado */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Precio Digital
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-indigo-600">
                      ${book.price.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">USD</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Disponibilidad
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isOutOfStock ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isOutOfStock ? 'Sin stock disponible' : `En inventario (${book.stock})`}
                  </span>
                </div>
              </div>

              {/* Sinopsis Completa */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sinopsis del Libro
                </h3>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {book.description}
                </p>
              </div>

              {/* Botón de compra / Carrito */}
              <div className="pt-4 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : isAdded
                      ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.99]'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Agregando al carrito...</span>
                    </>
                  ) : isAdded ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>¡Agregado al Carrito!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>
                        {isOutOfStock ? 'Producto Agotado' : 'Agregar al Carrito de Compras'}
                      </span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  ⚡ Entrega digital inmediata tras confirmar el pago con PayPal Sandbox.
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* ── 2. SECCIÓN DE RESEÑAS VERIFICADAS ────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Opiniones de la Comunidad</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Reseñas Verificadas de Clientes
              </h2>
            </div>

            {/* Promedio global */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-amber-400" />
                <span className="text-xl font-black text-slate-900">
                  {book.numReviews && book.numReviews > 0 ? (book.averageRating || 0).toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="text-left text-xs">
                <span className="text-slate-400 font-bold block">Promedio</span>
                <span className="text-slate-600 font-medium">{reviews.length} opinión(es)</span>
              </div>
            </div>
          </div>

          {/* Formulario de nueva reseña (visible si hay sesión iniciada) */}
          {user ? (
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800">
                Escribe tu reseña como <span className="text-indigo-600">{user.name}</span>
              </h3>

              {reviewError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm p-3.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm p-3.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                
                {/* Selector interactivo de estrellas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Calificación general:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || newRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">
                      {newRating} de 5 estrellas
                    </span>
                  </div>
                </div>

                {/* Comentario */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tu opinión sobre el contenido:
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    placeholder="Cuéntale a otros desarrolladores qué te pareció el e-book, qué aprendiste y si lo recomiendas..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 text-right block">
                    {newComment.length} / 1000 caracteres
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                    Solo compradores verificados pueden publicar
                  </span>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publicar Reseña</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                ¿Compraste este e-book? Inicia sesión para compartir tu experiencia con la comunidad.
              </p>
              <Link
                href="/login"
                className="inline-block text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Iniciar sesión para calificar
              </Link>
            </div>
          )}

          {/* Lista de Reseñas */}
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs font-medium">Cargando opiniones...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  Aún no hay reseñas para este e-book.
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  ¡Sé el primero en calificarlo tras completar tu compra!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => {
                  const isAuthorOrAdmin =
                    user && (rev.user?._id === user._id || user.role === 'ADMIN');
                  const formattedReviewDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '';

                  return (
                    <div key={rev._id} className="py-5 first:pt-0 last:pb-0 space-y-2">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {rev.user?.name || 'Usuario'}
                          </span>

                          {rev.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              Compra verificada
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 font-medium">
                            {formattedReviewDate}
                          </span>
                        </div>

                        {/* Botón Eliminar si es autor o ADMIN */}
                        {isAuthorOrAdmin && (
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            disabled={deletingReviewId === rev._id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar reseña"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Estrellas de la reseña */}
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Comentario */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                        {rev.comment}
                      </p>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
