'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { useSocket } from '../../../context/SocketContext';
import { Star, ShieldCheck, Truck, RefreshCw, ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const { socket } = useSocket();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/books/${id}`);
        setBook(res.data.data);
      } catch (e) {
        console.error('Error cargando detalle del libro:', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBook();
  }, [id]);

  // Actualización en tiempo real del stock con Socket.IO
  useEffect(() => {
    if (!socket || !id) return;

    const handleStockUpdate = (data) => {
      if (data.bookId === id) {
        setBook((prev) => (prev ? { ...prev, stock: data.stock } : prev));
      }
    };

    socket.on('book:stock_updated', handleStockUpdate);
    return () => socket.off('book:stock_updated', handleStockUpdate);
  }, [socket, id]);

  const handleAddToCart = () => {
    if (!book || book.stock <= 0) return;
    addToCart(book, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 animate-pulse space-y-8">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Libro no encontrado</h2>
        <a href="/books" className="text-indigo-600 text-sm font-semibold hover:underline">
          Volver al catálogo
        </a>
      </div>
    );
  }

  const effectivePrice = book.discountPrice > 0 ? book.discountPrice : book.price;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Botón Volver */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al catálogo</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Imagen de Portada */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-md">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-[450px] object-cover"
            />
            {book.discountPrice > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
                Oferta Especial
              </span>
            )}
          </div>

          {/* Información Detallada */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">
                {book.category?.name || 'Categoría'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 leading-tight">
                {book.title}
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Por <span className="text-slate-800 font-bold">{book.author}</span>
              </p>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-800">{book.rating}</span>
                </div>
                <span className="text-xs text-slate-400">({book.numReviews} reseñas verificadas)</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{book.pages} páginas</span>
              </div>
            </div>

            {/* Precio & Stock */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Precio unitario</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">${effectivePrice.toFixed(2)}</span>
                  {book.discountPrice > 0 && (
                    <span className="text-sm text-slate-400 line-through">${book.price.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Disponibilidad</span>
                {book.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {book.stock} en stock
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    Agotado
                  </span>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                Sinopsis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Selector de Cantidad y Botón de Carrito */}
            {book.stock > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700 uppercase">Cantidad:</span>
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold text-slate-800">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                      className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">Máx. {book.stock}</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                    added
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>¡Añadido al carrito con éxito!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>Agregar al Carrito • ${(effectivePrice * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Garantías */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-500" />
                <span>Envío gratis desde $50</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Pago seguro PayPal Sandbox</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
