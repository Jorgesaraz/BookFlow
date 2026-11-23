'use client';

import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { BookOpen, Sparkles, TrendingUp, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, catsRes] = await Promise.all([
          api.get('/books?limit=4'),
          api.get('/books/categories/all')
        ]);
        setFeaturedBooks(booksRes.data.data || []);
        setCategories(catsRes.data.data || []);
      } catch (err) {
        console.error('Error cargando datos del home:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (book) => {
    addToCart(book, 1);
    setAddedId(book._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nueva Colección y Experiencia en Tiempo Real</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Fluye a través del <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">conocimiento</span> sin límites.
            </h1>

            <p className="text-base sm:text-lg text-indigo-100/90 leading-relaxed max-w-xl">
              Explora una biblioteca moderna de libros electrónicos y físicos. Realiza tus pedidos con PayPal Sandbox y sigue cada etapa en tiempo real con nuestra arquitectura reactiva.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="/books"
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-0.5"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl backdrop-blur-md border border-white/20 transition"
              >
                <span>Iniciar Sesión</span>
              </a>
            </div>

            {/* Badges de confianza */}
            <div className="pt-6 border-t border-indigo-700/50 flex flex-wrap gap-6 text-xs text-indigo-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pagos Seguros PayPal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Kanban en Vivo para Admins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Actualización Inmediata de Stock</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <span className="text-xs text-indigo-200 font-mono">BookFlow v1.0 • Live</span>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex gap-4 items-center">
                  <img
                    src="https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=300&q=80"
                    alt="Clean Code"
                    className="w-16 h-20 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Destacado</span>
                    <h4 className="font-bold text-sm text-white line-clamp-1">Clean Code</h4>
                    <p className="text-xs text-slate-300">Robert C. Martin</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-emerald-400">$29.99</span>
                      <span className="text-[10px] line-through text-slate-400">$34.99</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-300">Tablero Kanban Administrador</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    Socket.IO Activo
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Categorías Principales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Categorías Populares</h2>
            <p className="text-sm text-slate-500 mt-1">Encuentra exactamente lo que buscas por especialidad</p>
          </div>
          <a href="/books" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <a
              key={cat._id}
              href={`/books?category=${cat.slug}`}
              className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-500/50 shadow-sm hover:shadow-md transition flex flex-col items-center text-center space-y-2 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description || 'Explorar títulos'}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Libros Destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Títulos Destacados</h2>
            <p className="text-sm text-slate-500 mt-1">Nuestra selección recomendada de la semana</p>
          </div>
          <a href="/books" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Explorar catálogo completo <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4">
                <div className="w-full h-56 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
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
                  {book.discountPrice > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow">
                      Oferta
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white font-semibold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {book.rating}
                  </span>
                </a>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {book.category?.name || 'Libro'}
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
                      onClick={() => handleAddToCart(book)}
                      disabled={book.stock <= 0}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                        addedId === book._id
                          ? 'bg-emerald-600 text-white'
                          : book.stock > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {addedId === book._id
                        ? '¡Agregado!'
                        : book.stock > 0
                        ? 'Agregar'
                        : 'Agotado'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
