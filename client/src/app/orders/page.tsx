'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import {
  Package,
  Calendar,
  DollarSign,
  Download,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Clock,
  ArrowRight
} from 'lucide-react';

interface OrderBook {
  _id: string;
  title: string;
  author: string;
  coverImage: string;
  category: string;
  digitalFile?: string;
}

interface OrderItem {
  _id: string;
  book: OrderBook;
  title: string;
  price: number;
  quantity: number;
}

interface OrderDetail {
  _id: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paypalOrderId: string;
  paypalCaptureId?: string;
  paidAt?: string;
  createdAt: string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error al cargar órdenes:', err);
      setError('No se pudo cargar el historial de compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="border-b border-slate-200/80 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Package className="w-8 h-8 text-indigo-600" />
                <span>Mis Compras y Biblioteca</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Consulta tus e-books adquiridos y accede directamente a las descargas digitales de tus lecturas.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Explorar más libros</span>
            </Link>
          </div>

          {/* Estado Cargando */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4"
                >
                  <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-20 bg-slate-100 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-3xl text-center space-y-3">
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={fetchOrders}
                className="text-xs font-bold bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition"
              >
                Reintentar
              </button>
            </div>
          ) : orders.length === 0 ? (
            /* Estado Vacío */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto space-y-5 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Aún no tienes compras realizadas</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Tus e-books comprados aparecerán en esta sección con sus respectivos enlaces de descarga permanente y comprobantes de PayPal.
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
            /* Lista de Órdenes */
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  {/* Encabezado de la Orden */}
                  <div className="bg-slate-50/80 p-5 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          Orden #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Pagado
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(order.paidAt || order.createdAt)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          PayPal ID: <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px] text-slate-700">{order.paypalOrderId}</code>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Monto Pagado
                      </span>
                      <span className="text-xl font-black text-indigo-600">
                        ${order.totalAmount.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-400">USD</span>
                      </span>
                    </div>
                  </div>

                  {/* Lista de Ítems / E-books */}
                  <div className="p-5 sm:p-6 divide-y divide-slate-100">
                    {order.items.map((item, index) => {
                      const book = item.book;
                      const hasDigitalFile = Boolean(book?.digitalFile);

                      return (
                        <div
                          key={item._id || index}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Detalle del Libro */}
                          <div className="flex items-center gap-4">
                            <img
                              src={book?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                              alt={item.title}
                              className="w-14 h-20 object-cover rounded-xl shadow-xs border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div className="space-y-1">
                              <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                {book?.category || 'E-Book'}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                {item.title || book?.title}
                              </h4>
                              <p className="text-xs text-slate-500">Por {book?.author || 'Autor BookFlow'}</p>
                              <p className="text-xs font-bold text-slate-600">
                                Cantidad: {item.quantity} un. • ${item.price.toFixed(2)} USD c/u
                              </p>
                            </div>
                          </div>

                          {/* Botón de Descarga / Acceso al E-Book */}
                          <div className="shrink-0 flex items-center justify-end">
                            {hasDigitalFile ? (
                              <a
                                href={book?.digitalFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
                              >
                                <Download className="w-4 h-4" />
                                <span>Descargar / Acceder E-book</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Archivo digital procesándose...
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
