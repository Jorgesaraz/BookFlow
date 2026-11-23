'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Eye, CheckCircle2, AlertCircle, BookOpen, Check, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export interface BookItem {
  _id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  coverImage: string;
  availability: boolean;
}

interface BookCardProps {
  book: BookItem;
  onAddToCartToast?: (title: string) => void;
}

export default function BookCard({ book, onAddToCartToast }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const { addToCart } = useCart();
  const isOutOfStock = !book.availability || book.stock === 0;

  const handleAdd = async () => {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    const result = await addToCart(book._id, 1);
    setIsAdding(false);

    if (result.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
      if (onAddToCartToast) {
        onAddToCartToast(book.title);
      }
    } else if (result.message && onAddToCartToast) {
      onAddToCartToast(result.message);
    }
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden">
      {/* Portada */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {!imageError && book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-50 to-slate-100 text-slate-400">
            <BookOpen className="w-12 h-12 text-indigo-300 mb-2" />
            <span className="text-xs font-semibold text-slate-500 line-clamp-2">{book.title}</span>
          </div>
        )}

        {/* Insignia de Categoría */}
        <div className="absolute top-3 left-3">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg tracking-wide uppercase shadow">
            {book.category}
          </span>
        </div>

        {/* Insignia de Disponibilidad / Agotado */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
              <AlertCircle className="w-3 h-3" />
              Agotado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
              <CheckCircle2 className="w-3 h-3" />
              Disponible ({book.stock})
            </span>
          )}
        </div>
      </div>

      {/* Contenido / Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition">
            <Link href={`/books/${book._id}`}>{book.title}</Link>
          </h3>
          <p className="text-xs font-medium text-slate-500">Por {book.author}</p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Precio</span>
            <span className="text-xl font-extrabold text-indigo-600">
              ${book.price.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/books/${book._id}`}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 text-xs font-bold transition shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Ver detalle</span>
          </Link>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock || isAdding}
            className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isAdded
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:shadow'
            }`}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agregando...</span>
              </>
            ) : isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Sin stock' : 'Agregar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
