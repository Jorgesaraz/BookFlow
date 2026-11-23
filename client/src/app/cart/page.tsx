'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useCart } from '../../context/CartContext';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '../../lib/api';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  BookOpen,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Loader2
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    totalItems,
    subtotal,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart
  } = useCart();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    'AW0z7hCaAm6CiGPNwWY1VE1ejZzvCl2IHqH5khpYLpSLisjmskA60FomkG-cxl75nApMKF8N0zGWxCy5';

  const handleUpdate = async (bookId: string, newQty: number) => {
    setActionLoadingId(bookId);
    setPaymentError(null);
    await updateQuantity(bookId, newQty);
    setActionLoadingId(null);
  };

  const handleRemove = async (bookId: string) => {
    setActionLoadingId(bookId);
    setPaymentError(null);
    await removeFromCart(bookId);
    setActionLoadingId(null);
  };

  const handleClear = async () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar tu carrito de compras?')) {
      setPaymentError(null);
      await clearCart();
    }
  };

  // Crear la orden en PayPal Sandbox a través de nuestro backend
  const handleCreateOrder = async (): Promise<string> => {
    setPaymentError(null);
    try {
      const res = await api.post('/orders/create-paypal-order');
      if (!res.data.success || !res.data.paypalOrderId) {
        throw new Error(res.data.message || 'Error al iniciar la orden de pago en PayPal.');
      }
      return res.data.paypalOrderId;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Error al generar la orden en PayPal Sandbox.';
      setPaymentError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Capturar el pago tras la aprobación del comprador en el popup de PayPal
  const handleApprove = async (data: any) => {
    setPaymentProcessing(true);
    setPaymentError(null);
    try {
      const res = await api.post('/orders/capture-paypal-order', {
        paypalOrderId: data.orderID
      });

      if (res.data.success) {
        setPaymentSuccess(true);
        await refreshCart();
        setTimeout(() => {
          router.push('/orders');
        }, 2200);
      } else {
        setPaymentError(res.data.message || 'No se pudo confirmar la captura del pago.');
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Error al capturar el pago en PayPal Sandbox.';
      setPaymentError(errorMsg);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayPalError = (err: any) => {
    console.error('Error reportado por PayPal Sandbox:', err);
    setPaymentError('Ocurrió un error al procesar el pago con PayPal o la transacción fue cancelada.');
  };

  return (
    <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Banner de Éxito Flotante */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-emerald-100">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">¡Pago Confirmado con Éxito!</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tu orden ha sido registrada correctamente. Ya puedes acceder y descargar tus e-books en tu biblioteca digital.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirigiendo a Mis Compras...</span>
              </div>
            </div>
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
                Revisa y confirma tus libros electrónicos antes de pagar con PayPal Sandbox.
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

          {/* Alerta de Error de Pago o Stock */}
          {paymentError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">No se pudo completar la operación</span>
                  <span>{paymentError}</span>
                </div>
              </div>
              <button
                onClick={() => setPaymentError(null)}
                className="text-rose-400 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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

              {/* Resumen de Compra y Botón PayPal (4 cols) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-6 sticky top-24">
                <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span>Resumen del Pedido</span>
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

                {/* Integración Oficial de PayPal Sandbox */}
                <div className="pt-2">
                  {paymentProcessing ? (
                    <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                      <p className="text-xs font-bold text-indigo-900">Procesando y capturando el pago...</p>
                      <p className="text-[11px] text-slate-500">Por favor, no cierres esta ventana.</p>
                    </div>
                  ) : (
                    <PayPalScriptProvider
                      options={{
                        clientId: paypalClientId,
                        currency: 'USD',
                        intent: 'capture'
                      }}
                    >
                      <div className="min-h-[120px]">
                        <PayPalButtons
                          style={{
                            layout: 'vertical',
                            shape: 'rect',
                            color: 'gold',
                            label: 'pay'
                          }}
                          createOrder={handleCreateOrder}
                          onApprove={handleApprove}
                          onError={handlePayPalError}
                        />
                      </div>
                    </PayPalScriptProvider>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pago seguro procesado por PayPal Sandbox.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Acceso y descarga de tus e-books garantizados al instante.</span>
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
