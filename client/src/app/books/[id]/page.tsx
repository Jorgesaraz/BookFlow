'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useSocket } from '../../../context/SocketContext';
import { useCart } from '../../../context/CartContext';
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
  Check
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
  createdAt: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const { socket } = useSocket();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBook = async () => {
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
    };

    fetchBook();
  }, [id]);

  // Actualización de stock en tiempo real si el socket está disponible
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

    socket.on('book:stock_updated', handleStockUpdate);
    return () => {
      socket.off('book:stock_updated', handleStockUpdate);
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

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Botón Volver */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Principal</span>
        </Link>

        {/* Tarjeta de Detalle */}
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
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border border-indigo-100">
                  {book.category}
                </span>

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

      </div>
    </div>
  );
}
