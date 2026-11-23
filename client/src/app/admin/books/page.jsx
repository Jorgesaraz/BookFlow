'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useSocket } from '../../../context/SocketContext';
import { Package, Plus, Edit, Trash2, Search, AlertCircle, Check, X } from 'lucide-react';

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    isbn: '',
    price: '',
    discountPrice: 0,
    stock: 10,
    category: '',
    coverImage: '',
    pages: 300,
  });

  const { socket } = useSocket();

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/books?limit=50'),
        api.get('/books/categories/all')
      ]);
      setBooks(bRes.data.data || []);
      setCategories(cRes.data.data || []);
    } catch (err) {
      console.error('Error cargando libros/categorías en admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Escuchar cambios de stock vía Socket.IO
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

  const handleOpenCreate = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      description: '',
      isbn: '',
      price: '',
      discountPrice: 0,
      stock: 10,
      category: categories[0]?._id || '',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      pages: 300,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      isbn: book.isbn || '',
      price: book.price,
      discountPrice: book.discountPrice || 0,
      stock: book.stock,
      category: book.category?._id || book.category || '',
      coverImage: book.coverImage,
      pages: book.pages || 300,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este libro?')) return;
    try {
      await api.delete(`/books/${id}`);
      setBooks((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert('Error al eliminar libro: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        const res = await api.put(`/books/${editingBook._id}`, formData);
        setBooks((prev) => prev.map((b) => (b._id === editingBook._id ? res.data.data : b)));
      } else {
        const res = await api.post('/books', formData);
        setBooks((prev) => [res.data.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al guardar libro: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventario de Libros</h1>
          <p className="text-xs text-slate-500 mt-1">
            Administra el catálogo, modifica precios y supervisa el stock en tiempo real.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Libro</span>
        </button>
      </div>

      {/* Barra de Filtro Rápido */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por título o autor en la tabla..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Tabla de Libros */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-4 px-6">Libro</th>
                <th className="py-4 px-6">Categoría</th>
                <th className="py-4 px-6">Precio</th>
                <th className="py-4 px-6">Stock</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBooks.map((book) => (
                <tr key={book._id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-6 flex items-center gap-3">
                    <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded shadow-xs" />
                    <div>
                      <span className="font-bold text-slate-900 block max-w-xs truncate">{book.title}</span>
                      <span className="text-slate-500 text-[11px]">{book.author}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 font-semibold text-slate-600">
                    {book.category?.name || 'General'}
                  </td>
                  <td className="py-3 px-6">
                    <span className="font-bold text-slate-900">${book.price.toFixed(2)}</span>
                    {book.discountPrice > 0 && (
                      <span className="text-[10px] text-emerald-600 block">Oferta: ${book.discountPrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        book.stock > 5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : book.stock > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {book.stock} un.
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(book)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Editar libro"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(book._id)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar libro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editingBook ? 'Editar Libro' : 'Nuevo Libro'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Autor</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Stock Disponible</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">URL de Portada</label>
                  <input
                    type="url"
                    required
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Descripción / Sinopsis</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Guardar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
