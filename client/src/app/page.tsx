'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import BookCard, { BookItem } from '../components/BookCard';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Zap,
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';

export default function HomePage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Toast temporal para Fase 5
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Consulta de libros con debounce o filtros
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sort', sortBy);

      const res = await api.get(`/books?${params.toString()}`);
      if (res.data.success) {
        setBooks(res.data.data || []);
        if (res.data.categories && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

  // Carga inicial y categorías
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await api.get('/books/categories');
        if (catRes.data.success) {
          setCategories(catRes.data.data || []);
        }
      } catch (e) {
        // Fallback a categorías de GET /api/books
      }
      fetchBooks();
    };
    fetchInitialData();
  }, []);

  // Efecto cuando cambian los filtros (con debounce para la búsqueda)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const handleAddToCartToast = (bookTitle: string) => {
    setToastMessage(`"${bookTitle}" seleccionado. El carrito se conectará en la Fase 5.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
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

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Plataforma Premium de Libros Electrónicos</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl">
            Impulsa tu mente con los mejores{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-300">
              e-books para desarrolladores
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Descubre títulos de alta especialización en programación, arquitectura de software, inteligencia artificial y diseño. Acceso inmediato y stock gestionado en tiempo real.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Descargas Inmediatas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pagos Verificados PayPal</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Contenido Actualizado</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Principal de Catálogo y Filtros */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-8">
        
        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base sm:text-lg">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
              <span>Filtros y Búsqueda de Libros</span>
            </div>
            {(searchTerm || selectedCategory !== 'ALL' || minPrice || maxPrice || sortBy !== 'newest') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            
            {/* 1. Barra de Búsqueda por Título o Autor */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* 2. Selector de Categoría */}
            <div className="lg:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filtro de Precio Mínimo y Máximo */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <input
                type="number"
                placeholder="Min $"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <span className="text-slate-400 text-xs font-bold">-</span>
              <input
                type="number"
                placeholder="Max $"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* 4. Selector de Ordenamiento */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
            </div>

          </div>
        </div>

        {/* Resultados del Catálogo */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Libros Disponibles{' '}
              {!loading && (
                <span className="text-sm font-semibold text-slate-500 ml-2">
                  ({books.length} {books.length === 1 ? 'libro' : 'libros'})
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            /* Skeleton Loading */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4 animate-pulse"
                >
                  <div className="aspect-[3/4] bg-slate-200 rounded-xl w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            /* Estado Vacío */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No se encontraron libros</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                No hay resultados que coincidan con los criterios de búsqueda o filtros seleccionados.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restablecer filtros</span>
              </button>
            </div>
          ) : (
            /* Cuadrícula de Libros */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onAddToCartToast={handleAddToCartToast}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
