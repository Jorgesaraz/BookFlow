'use client';

import React, { useState, useEffect, Suspense } from 'react';
import api from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { Search, Filter, Star, BookOpen, Check, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function BooksContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialKeyword = searchParams.get('keyword') || '';

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addedBookId, setAddedBookId] = useState(null);

  const { addToCart } = useCart();
  const { socket } = useSocket();

  // Cargar categorías una sola vez
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/books/categories/all');
        setCategories(res.data.data || []);
      } catch (e) {
        console.error('Error cargando categorías:', e);
      }
    };
    fetchCats();
  }, []);

  // Cargar libros según filtros
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', currentPage);
      params.append('limit', 12);

      const res = await api.get(`/books?${params.toString()}`);
      setBooks(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      console.error('Error cargando libros:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, sortBy, currentPage]);

  // Escuchar cambios de stock en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleStockUpdate = (data) => {
      setBooks((prev) =>
        prev.map((b) => (b._id === data.bookId ? { ...b, stock: data.stock } : b))
      );
    };

    socket.on('book:stock_updated', handleStockUpdate);
    return () => socket.off('book:stock_updated', handleStockUpdate);
  }, [socket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks();
  };

  const handleAdd = (book) => {
    addToCart(book, 1);
    setAddedBookId(book._id);
    setTimeout(() => setAddedBookId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catálogo de Libros</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explora títulos seleccionados con precios accesibles y stock verificado en vivo.
          </p>
        </div>

        {/* Ordenamiento */}
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="rating">Mejor Calificados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Barra Lateral de Filtros */}
        <aside className="space-y-6">
          {/* Buscador */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Búsqueda
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Título, autor..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-xl transition"
            >
              Aplicar Búsqueda
            </button>
          </form>

          {/* Categorías */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Categorías
            </label>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex justify-between items-center ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Todas las categorías</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex justify-between items-center ${
                    selectedCategory === cat.slug
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro de Precio */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Rango de Precio ($)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 p-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 p-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <button
              onClick={() => { setCurrentPage(1); fetchBooks(); }}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2 rounded-xl border border-indigo-200 transition"
            >
              Filtrar por Precio
            </button>
          </div>
        </aside>

        {/* Cuadrícula de Libros */}
        <section className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4">
                  <div className="w-full h-64 bg-slate-200 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No encontramos libros con estos criterios</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba cambiando la palabra clave, limpiando los filtros de precio o seleccionando otra categoría.
              </p>
              <button
                onClick={() => {
                  setKeyword('');
                  setSelectedCategory('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setCurrentPage(1);
                  fetchBooks();
                }}
                className="text-xs font-semibold text-indigo-600 underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                >
                  <a href={`/books/${book._id}`} className="relative h-64 overflow-hidden bg-slate-100 block">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {book.stock <= 3 && book.stock > 0 && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                        ¡Últimas {book.stock} unidades!
                      </span>
                    )}
                    {book.stock === 0 && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                        Agotado
                      </span>
                    )}
                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white font-semibold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {book.rating}
                    </span>
                  </a>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                        {book.category?.name || 'General'}
                      </span>
                      <a href={`/books/${book._id}`}>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1 mt-0.5 text-base">
                          {book.title}
                        </h3>
                      </a>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{book.author}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black text-slate-900">
                          ${(book.discountPrice > 0 ? book.discountPrice : book.price).toFixed(2)}
                        </div>
                        {book.discountPrice > 0 && (
                          <div className="text-xs text-slate-400 line-through">
                            ${book.price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAdd(book)}
                        disabled={book.stock <= 0}
                        className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                          addedBookId === book._id
                            ? 'bg-emerald-600 text-white'
                            : book.stock > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {addedBookId === book._id ? (
                          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Listo</span>
                        ) : book.stock > 0 ? (
                          'Agregar'
                        ) : (
                          'Sin Stock'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse text-center text-slate-400 text-xs font-semibold">
        Cargando catálogo de BookFlow...
      </div>
    }>
      <BooksContent />
    </Suspense>
  );
}
