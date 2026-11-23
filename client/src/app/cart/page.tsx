'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard
} from 'lucide-react';

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const [checkoutNotification, setCheckoutNotification] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleUpdate = async (bookId: string, newQty: number) => {
    setActionLoadingId(bookId);
    await updateQuantity(bookId, newQty);
    setActionLoadingId(null);
  };

  const handleRemove = async (bookId: string) => {
    setActionLoadingId(bookId);
    await removeFromCart(bookId);
    setActionLoadingId(null);
  };

  const handleClear = async () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar tu carrito de compras?')) {
      await clearCart();
    }
  };

  const handleCheckoutClick = () => {
    setCheckoutNotification(
      'El módulo de pago seguro e integración con PayPal Sandbox se activará en la Fase 6.'
    );
    setTimeout(() => {
      setCheckoutNotification(null);
    }, 5000);
  };

  return (
    <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Notificación de Checkout para Fase 6 */}
        {checkoutNotification && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="text-xs sm:text-sm font-medium">
              <span className="font-bold block text-indigo-300">Próximo paso: Fase 6</span>
              {checkoutNotification}
            </div>
            <button
              onClick={() => setCheckoutNotification(null)}
              className="text-slate-400 hover:text-white ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <ShoppingCart className="w-7 h-7 text-indigo-600" />
                <span>Carrito de Compras</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Revisa y ajusta los libros electrónicos seleccionados antes de proceder al pago.
              </p>
            </div>

            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-200/60 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Carrito</span>
              </button>
            )}
          </div>

          {/* Estado Cargando */}
          {loading && items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Cargando tu carrito...</p>
            </div>
          ) : items.length === 0 ? (
            /* Estado Vacío */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">Tu carrito de compras está vacío</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Aún no has agregado ningún libro electrónico a tu carrito. Explora nuestra biblioteca y descubre lecturas especializadas.
                </p>
              </div>
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 transition active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explorar Catálogo</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Estado con Productos */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Lista de Libros (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {items.map((item) => {
                  const book = item.book;
                  if (!book) return null;

                  const isMaxStock = item.quantity >= book.stock;
                  const isBusy = actionLoadingId === book._id;

                  return (
                    <div
                      key={book._id}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Portada e Información Básica */}
                      <div className="flex items-center gap-4">
                        <Link href={`/books/${book._id}`} className="shrink-0">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-xl shadow-sm border border-slate-200 bg-slate-100 hover:opacity-90 transition"
                          />
                        </Link>
                        <div className="space-y-1 min-w-0">
                          <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                            {book.category}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                            <Link href={`/books/${book._id}`} className="hover:text-indigo-600 transition">
                              {book.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-slate-500">Por {book.author}</p>
                          <p className="text-xs font-extrabold text-indigo-600 pt-1">
                            ${book.price.toFixed(2)} USD <span className="font-normal text-slate-400">c/u</span>
                          </p>
                        </div>
                      </div>

                      {/* Controles de Cantidad y Acciones */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Selector de Cantidad */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleUpdate(book._id, item.quantity - 1)}
                            disabled={isBusy}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition disabled:opacity-50 border border-slate-200 shadow-xs"
                            title="Disminuir cantidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 text-center font-bold text-xs sm:text-sm text-slate-900">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => handleUpdate(book._id, item.quantity + 1)}
                            disabled={isBusy || isMaxStock}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition border shadow-xs ${
                              isMaxStock
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title={isMaxStock ? `Stock máximo (${book.stock}) alcanzado` : 'Aumentar cantidad'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal del Ítem y Botón Eliminar */}
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900 text-sm sm:text-base">
                            ${(book.price * item.quantity).toFixed(2)} USD
                          </span>

                          <button
                            onClick={() => handleRemove(book._id)}
                            disabled={isBusy}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Resumen de Compra (4 cols) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-6 sticky top-24">
                <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
                  Resumen del Pedido
                </h2>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Cantidad de E-Books</span>
                    <span className="font-bold text-slate-900">{totalItems} un.</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal de Artículos</span>
                    <span className="font-bold text-slate-900">${subtotal.toFixed(2)} USD</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Envío Digital</span>
                    <span className="font-bold text-emerald-600">Gratis (Inmediato)</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-800">Total a Pagar</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-600">
                        ${subtotal.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">USD</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-[0.99]"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceder al Pago</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pago verificado vía PayPal Sandbox.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Descarga digital protegida disponible al instante.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </ProtectedRoute>
  );
}
