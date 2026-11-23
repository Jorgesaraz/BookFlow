'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import api from '../../../lib/api';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  Package,
  ExternalLink,
  Layers
} from 'lucide-react';

interface BookAdminItem {
  _id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  coverImage: string;
  digitalFile?: string;
  availability: boolean;
  createdAt: string;
}

const CATEGORY_SUGGESTIONS = [
  'Programación',
  'Arquitectura de Software',
  'Inteligencia Artificial',
  'Diseño UX/UI',
  'Negocios',
  'Ciencia Ficción'
];

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookAdminItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Programación',
    description: '',
    price: '',
    stock: '',
    coverImage: '',
    digitalFile: ''
  });

  // Notificación tipo toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books');
      if (res.data.success) {
        setBooks(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error cargando libros de administración:', err);
      showFeedback('error', 'Error al cargar libros del catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleOpenCreate = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      category: 'Programación',
      description: '',
      price: '',
      stock: '10',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      digitalFile: 'https://storage.bookflow.local/ebooks/nuevo-libro.pdf'
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book: BookAdminItem) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description,
      price: book.price.toString(),
      stock: book.stock.toString(),
      coverImage: book.coverImage,
      digitalFile: book.digitalFile || 'https://storage.bookflow.local/ebooks/archivo-digital.pdf'
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (book: BookAdminItem) => {
    const confirmed = window.confirm(
      `¿Confirmas que deseas eliminar el libro "${book.title}" del catálogo?`
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/books/${book._id}`);
      if (res.data.success) {
        showFeedback('success', `El libro "${book.title}" ha sido eliminado exitosamente.`);
        loadBooks();
      }
    } catch (err: any) {
      console.error('Error eliminando libro:', err);
      showFeedback('error', err.response?.data?.message || 'Error al eliminar el libro.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    // Validaciones básicas
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.category.trim() ||
      !formData.description.trim() ||
      formData.price === '' ||
      formData.stock === '' ||
      !formData.coverImage.trim() ||
      !formData.digitalFile.trim()
    ) {
      setModalError('Todos los campos son obligatorios.');
      setModalLoading(false);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      coverImage: formData.coverImage.trim(),
      digitalFile: formData.digitalFile.trim()
    };

    try {
      if (editingBook) {
        // Actualizar libro existente (PUT)
        const res = await api.put(`/books/${editingBook._id}`, payload);
        if (res.data.success) {
          showFeedback('success', `Libro "${payload.title}" actualizado con éxito.`);
          setIsModalOpen(false);
          loadBooks();
        }
      } else {
        // Crear nuevo libro (POST)
        const res = await api.post('/books', payload);
        if (res.data.success) {
          showFeedback('success', `Libro "${payload.title}" creado con éxito en el catálogo.`);
          setIsModalOpen(false);
          loadBooks();
        }
      }
    } catch (err: any) {
      console.error('Error guardando libro:', err);
      setModalError(err.response?.data?.message || 'Error al guardar el libro.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Notificación Flotante */}
        {feedback && (
          <div
            className={`fixed bottom-6 right-6 z-50 max-w-md px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-bounce ${
              feedback.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium">{feedback.message}</p>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header de Gestión */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Panel de Administración</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Gestión de Catálogo de Libros
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Control de inventario, stock en tiempo real y administración de e-books digitales.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Libro</span>
            </button>
          </div>

          {/* Filtros de la Tabla */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Buscar por título, autor o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tabla de Libros */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-4 px-6">Libro</th>
                    <th className="py-4 px-6">Categoría</th>
                    <th className="py-4 px-6">Precio</th>
                    <th className="py-4 px-6">Stock</th>
                    <th className="py-4 px-6">Disponibilidad</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-semibold text-xs">Cargando inventario de libros...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No se encontraron libros que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((book) => {
                      const isAvailable = book.availability && book.stock > 0;
                      return (
                        <tr key={book._id} className="hover:bg-slate-50/60 transition">
                          
                          {/* Miniatura y Título */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-10 h-14 object-cover rounded-lg shadow-sm border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                                  {book.title}
                                </span>
                                <span className="text-xs text-slate-500 block truncate">
                                  Por {book.author}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Categoría */}
                          <td className="py-4 px-6">
                            <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              {book.category}
                            </span>
                          </td>

                          {/* Precio */}
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-slate-900">
                              ${book.price.toFixed(2)}
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800">{book.stock} un.</span>
                          </td>

                          {/* Disponibilidad */}
                          <td className="py-4 px-6">
                            {isAvailable ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Disponible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Agotado
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(book)}
                                className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
                                title="Editar Libro"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(book)}
                                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                                title="Eliminar Libro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Crear / Editar Libro */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-black text-slate-900">
                    {editingBook ? 'Editar Libro' : 'Nuevo Libro Electrónico'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm p-4 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Título y Autor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Título *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Clean Code en TypeScript"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Autor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Categoría y Precio / Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Categoría *
                    </label>
                    <input
                      type="text"
                      required
                      list="categories-list"
                      placeholder="Ej. Programación"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <datalist id="categories-list">
                      {CATEGORY_SUGGESTIONS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Precio (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Ej. 29.99"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Ej. 15"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* URL de Portada */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    URL de Portada (Cover Image) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Archivo Digital (Solo Admin) */}
                <div className="space-y-1.5 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Archivo Digital del E-Book (Solo visible por ADMIN) *</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="https://storage.bookflow.local/ebooks/archivo.pdf"
                    value={formData.digitalFile}
                    onChange={(e) => setFormData({ ...formData, digitalFile: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-[11px] text-indigo-600/80">
                    🔒 Este archivo se almacena protegido en el servidor con select:false y no se expone a consultas públicas.
                  </p>
                </div>

                {/* Descripción / Sinopsis */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Sinopsis / Descripción Detallada *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe los temas, tecnologías y aprendizajes clave del libro..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Botones del Modal */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {modalLoading ? 'Guardando...' : editingBook ? 'Guardar Cambios' : 'Crear Libro'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
