'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Trash2, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, itemsPrice, shippingPrice, totalPrice } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Tu carrito de compras está vacío</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Parece que aún no has agregado ningún libro a tu carrito. Explora nuestra amplia biblioteca y encuentra tu próxima gran lectura.
        </p>
        <div>
          <a
            href="/books"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-md shadow-indigo-500/20 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explorar Catálogo</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Carrito de Compras</h1>
          <p className="text-xs text-slate-500 mt-1">Revisa tus artículos antes de proceder con el pago</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Vaciar Carrito</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Libros en Carrito */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.book}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex gap-4 sm:gap-6 items-center shadow-sm"
            >
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-16 sm:w-20 h-24 object-cover rounded-xl shadow-sm flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <a href={`/books/${item.book}`} className="font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 line-clamp-1">
                  {item.title}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">Precio Unitario: ${item.price.toFixed(2)}</p>
                <div className="text-xs text-slate-400 mt-0.5">Stock disponible: {item.stock}</div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button
                      onClick={() => updateQuantity(item.book, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs rounded-l-lg"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.book, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-2.5 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs rounded-r-lg disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.book)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-base sm:text-lg text-slate-900 block">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del Pedido */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6 h-fit">
          <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
            Resumen del Pedido
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Envío</span>
              <span className="font-semibold text-slate-900">
                {shippingPrice === 0 ? (
                  <span className="text-emerald-600 font-bold">Gratis</span>
                ) : (
                  `$${shippingPrice.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
              <span>Total Estimado</span>
              <span className="text-indigo-600 text-xl">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <a
            href="/checkout"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition"
          >
            <span>Continuar al Pago</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Integración oficial con PayPal Sandbox</span>
          </div>
        </div>

      </div>

    </div>
  );
}
