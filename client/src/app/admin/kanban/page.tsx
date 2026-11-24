'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute';
import api from '../../../lib/api';
import { useSocket } from '../../../context/SocketContext';
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  KanbanSquare,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Plus,
  RefreshCw,
  Layers,
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface OrderItem {
  _id?: string;
  book?: {
    _id: string;
    title: string;
    author?: string;
  };
  title: string;
  price: number;
  quantity: number;
}

interface OrderUser {
  _id?: string;
  name?: string;
  email?: string;
}

interface Order {
  _id: string;
  user?: OrderUser;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paypalOrderId?: string;
  createdAt: string;
}

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  coverImage: string;
  availability: boolean;
}

interface DashboardMetrics {
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  totalClients: number;
  lowStockBooks: number;
}

type KanbanMode = 'orders' | 'inventory';

export default function AdminKanbanPage() {
  const { socket } = useSocket();

  // Modo actual: 'orders' o 'inventory'
  const [mode, setMode] = useState<KanbanMode>('orders');

  // Estado del Dashboard
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalClients: 0,
    lowStockBooks: 0
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null);

  // Notificación tipo toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── 1. Cargar datos del Dashboard (Métricas + Órdenes) ─────────────────────
  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoadingDashboard(true);
    try {
      const res = await api.get('/orders/admin/dashboard');
      if (res.data.success) {
        const fetchedMetrics = res.data.metrics || res.data.data?.metrics;
        const fetchedOrders = res.data.orders || res.data.data?.orders || [];
        if (fetchedMetrics) setMetrics(fetchedMetrics);
        if (fetchedOrders) setOrders(fetchedOrders);
      }
    } catch (err: any) {
      console.error('Error cargando métricas de dashboard:', err);
      if (!silent) showFeedback('error', 'Error al sincronizar datos del dashboard.');
    } finally {
      if (!silent) setLoadingDashboard(false);
    }
  }, []);

  // ── 2. Cargar inventario de libros para el Modo Inventario ─────────────────
  const fetchBooks = useCallback(async (silent = false) => {
    if (!silent) setLoadingBooks(true);
    try {
      const res = await api.get('/books');
      if (res.data.success) {
        setBooks(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error cargando catálogo de libros:', err);
    } finally {
      if (!silent) setLoadingBooks(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchDashboard();
    fetchBooks(true);
  }, [fetchDashboard, fetchBooks]);

  // Si cambia al modo 'inventory', asegurarse de tener los libros actualizados
  useEffect(() => {
    if (mode === 'inventory') {
      fetchBooks();
    }
  }, [mode, fetchBooks]);

  // ── 3. Sincronización en tiempo real vía Socket.IO ─────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Nueva orden pagada/creada
    const handleNewOrder = () => {
      fetchDashboard(true);
    };

    // Orden actualizada de estado por otro admin
    const handleOrderStatusUpdated = (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      fetchDashboard(true);
    };

    // Stock modificado
    const handleStockUpdated = (data: { bookId: string; stock: number; availability: boolean }) => {
      setBooks((prev) =>
        prev.map((b) =>
          b._id === data.bookId
            ? { ...b, stock: data.stock, availability: data.availability }
            : b
        )
      );
      fetchDashboard(true);
    };

    // Catálogo modificado
    const handleCatalogUpdated = () => {
      fetchBooks(true);
      fetchDashboard(true);
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderStatusUpdated);
    socket.on('stock-updated', handleStockUpdated);
    socket.on('catalog-updated', handleCatalogUpdated);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderStatusUpdated);
      socket.off('stock-updated', handleStockUpdated);
      socket.off('catalog-updated', handleCatalogUpdated);
    };
  }, [socket, fetchDashboard, fetchBooks]);

  // ── 4. Actualizar Estado de una Orden (Mover tarjeta Kanban) ───────────────
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'PENDING' | 'COMPLETED' | 'FAILED') => {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        const updated = res.data.data || res.data.order;
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? (updated || { ...o, status: newStatus }) : o))
        );
        showFeedback('success', `Orden #${orderId.slice(-6).toUpperCase()} movida a "${newStatus}".`);
        fetchDashboard(true);
      }
    } catch (err: any) {
      console.error('Error actualizando estado de la orden:', err);
      showFeedback('error', err.response?.data?.message || 'No se pudo actualizar el estado de la orden.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ── 5. Reponer Stock Rápido (+5 Stock) ────────────────────────────────────
  const handleAddStock = async (book: Book) => {
    setUpdatingBookId(book._id);
    const newStock = Number(book.stock) + 5;
    try {
      const res = await api.put(`/books/${book._id}`, {
        stock: newStock,
        availability: true
      });
      if (res.data.success) {
        setBooks((prev) =>
          prev.map((b) =>
            b._id === book._id ? { ...b, stock: newStock, availability: true } : b
          )
        );
        showFeedback('success', `+5 unidades añadidas a "${book.title}". Stock actual: ${newStock}.`);
        fetchDashboard(true);
      }
    } catch (err: any) {
      console.error('Error reponiendo stock:', err);
      showFeedback('error', 'Error al reponer stock del libro.');
    } finally {
      setUpdatingBookId(null);
    }
  };

  // ── Agrupaciones de Órdenes por Estado ─────────────────────────────────────
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const failedOrders = orders.filter((o) => o.status === 'FAILED');

  // ── Agrupaciones de Libros por Nivel de Stock ──────────────────────────────
  const availableBooks = books.filter((b) => b.stock > 2);
  const criticalBooks = books.filter((b) => b.stock > 0 && b.stock <= 2);
  const outOfStockBooks = books.filter((b) => b.stock === 0);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast Notificación Flotante */}
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

          {/* ── Encabezado y Navegación de Regreso ──────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tienda</span>
                </Link>
                <span className="text-slate-300">/</span>
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <KanbanSquare className="w-3.5 h-3.5" />
                  Operaciones
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Tablero Kanban & Analíticas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Monitoreo en tiempo real de transacciones, estados de pedidos y salud del inventario.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  fetchDashboard();
                  if (mode === 'inventory') fetchBooks();
                }}
                disabled={loadingDashboard || loadingBooks}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl transition disabled:opacity-50"
                title="Sincronizar datos"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDashboard || loadingBooks ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              <Link
                href="/admin/books"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-indigo-500/20 transition"
              >
                <Package className="w-4 h-4" />
                <span>Gestionar Libros</span>
              </Link>
            </div>
          </div>

          {/* ── 1. Tarjetas de Métricas (KPIs Superiores) ──────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* KPI 1: Ingresos Totales */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Ingresos Totales
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Solo órdenes completadas
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: Órdenes Completadas */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Órdenes Completadas
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.completedOrders}
                </p>
                <span className="text-[11px] font-semibold text-slate-500">
                  {metrics.pendingOrders} pendiente(s) por procesar
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: Clientes Registrados */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Clientes Registrados
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.totalClients}
                </p>
                <span className="text-[11px] font-semibold text-slate-500">
                  Usuarios con rol CLIENT
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4: Stock Crítico */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Stock Crítico (≤ 2 un.)
                </span>
                <p className={`text-2xl sm:text-3xl font-black tracking-tight ${metrics.lowStockBooks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {metrics.lowStockBooks}
                </p>
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${metrics.lowStockBooks > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {metrics.lowStockBooks > 0 ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> Requiere reposición inmediata
                    </>
                  ) : (
                    'Inventario en niveles óptimos'
                  )}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                metrics.lowStockBooks > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                  : 'bg-slate-50 text-slate-600 border-slate-100'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* ── 2. Selector de Modo Kanban ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setMode('orders')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                  mode === 'orders'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kanban de Órdenes ({orders.length})</span>
              </button>

              <button
                onClick={() => setMode('inventory')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                  mode === 'inventory'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Kanban de Inventario ({books.length})</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-2 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sincronización en vivo vía Socket.IO</span>
            </div>
          </div>

          {/* ── 3. Contenedor de Columnas Kanban ────────────────────────────── */}
          {mode === 'orders' ? (
            /* ════════════════ MODO 1: KANBAN DE ÓRDENES ════════════════ */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Columna 1: Pendiente */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Pendientes
                    </h2>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {pendingOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {pendingOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No hay órdenes pendientes.
                    </div>
                  ) : (
                    pendingOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        isUpdating={updatingOrderId === order._id}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Columna 2: Completado / Pagado */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Completadas / Pagadas
                    </h2>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {completedOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {completedOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No hay órdenes completadas aún.
                    </div>
                  ) : (
                    completedOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        isUpdating={updatingOrderId === order._id}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Columna 3: Fallido */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Fallidas / Canceladas
                    </h2>
                  </div>
                  <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {failedOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {failedOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No hay órdenes fallidas.
                    </div>
                  ) : (
                    failedOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        isUpdating={updatingOrderId === order._id}
                        onUpdateStatus={handleUpdateOrderStatus}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* ════════════════ MODO 2: KANBAN DE INVENTARIO ════════════════ */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Columna 1: Disponible (stock > 2) */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Disponibles (&gt; 2 un.)
                    </h2>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {availableBooks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {availableBooks.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No hay libros con stock abundante.
                    </div>
                  ) : (
                    availableBooks.map((book) => (
                      <InventoryCard
                        key={book._id}
                        book={book}
                        isUpdating={updatingBookId === book._id}
                        onAddStock={handleAddStock}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Columna 2: Stock Crítico (1 o 2 un.) */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Stock Crítico (1-2 un.)
                    </h2>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {criticalBooks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {criticalBooks.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      Ningún libro en estado crítico.
                    </div>
                  ) : (
                    criticalBooks.map((book) => (
                      <InventoryCard
                        key={book._id}
                        book={book}
                        isUpdating={updatingBookId === book._id}
                        onAddStock={handleAddStock}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Columna 3: Agotado (stock === 0) */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Agotados (0 un.)
                    </h2>
                  </div>
                  <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {outOfStockBooks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {outOfStockBooks.length === 0 ? (
                    <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No hay libros agotados.
                    </div>
                  ) : (
                    outOfStockBooks.map((book) => (
                      <InventoryCard
                        key={book._id}
                        book={book}
                        isUpdating={updatingBookId === book._id}
                        onAddStock={handleAddStock}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </ProtectedRoute>
  );
}

// ─── Componente Tarjeta de Orden (Modo 1) ──────────────────────────────────────

interface OrderCardProps {
  order: Order;
  isUpdating: boolean;
  onUpdateStatus: (orderId: string, status: 'PENDING' | 'COMPLETED' | 'FAILED') => void;
}

function OrderCard({ order, isUpdating, onUpdateStatus }: OrderCardProps) {
  const shortId = order._id ? `#${order._id.slice(-6).toUpperCase()}` : '#ORDEN';
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Fecha no disponible';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3.5">
      
      {/* Cabecera de la tarjeta: ID y Fecha */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
          {shortId}
        </span>
        <span className="text-[11px] text-slate-400 font-medium">{formattedDate}</span>
      </div>

      {/* Comprador */}
      <div className="space-y-0.5 text-xs">
        <p className="font-extrabold text-slate-800 truncate">
          {order.user?.name || 'Comprador BookFlow'}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {order.user?.email || 'email@desconocido.com'}
        </p>
      </div>

      {/* Lista Resumida de E-books */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          E-Books ({order.items.reduce((acc, it) => acc + (it.quantity || 1), 0)}):
        </span>
        <ul className="divide-y divide-slate-100">
          {order.items.slice(0, 3).map((item, idx) => (
            <li key={idx} className="py-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-700 truncate font-medium">
                {item.title || item.book?.title || 'E-Book Digital'}
              </span>
              <span className="text-slate-400 shrink-0 font-bold">x{item.quantity}</span>
            </li>
          ))}
          {order.items.length > 3 && (
            <li className="pt-1 text-[10px] text-indigo-600 font-semibold">
              +{order.items.length - 3} e-book(s) más...
            </li>
          )}
        </ul>
      </div>

      {/* Total y Selector de Acciones Rápidas */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Pagado</span>
          <span className="text-base font-black text-indigo-600">
            ${order.totalAmount?.toFixed(2) || '0.00'} <span className="text-[10px] text-slate-400">USD</span>
          </span>
        </div>

        {/* Botones de transición de estado */}
        <div className="flex items-center gap-1.5">
          {order.status !== 'COMPLETED' && (
            <button
              onClick={() => onUpdateStatus(order._id, 'COMPLETED')}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition border border-emerald-200 disabled:opacity-50"
              title="Mover a Completada"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobar</span>
            </button>
          )}

          {order.status !== 'PENDING' && (
            <button
              onClick={() => onUpdateStatus(order._id, 'PENDING')}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold transition border border-amber-200 disabled:opacity-50"
              title="Mover a Pendiente"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendiente</span>
            </button>
          )}

          {order.status !== 'FAILED' && (
            <button
              onClick={() => onUpdateStatus(order._id, 'FAILED')}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition border border-rose-200 disabled:opacity-50"
              title="Mover a Fallida"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Fallida</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Componente Tarjeta de Inventario (Modo 2) ────────────────────────────────

interface InventoryCardProps {
  book: Book;
  isUpdating: boolean;
  onAddStock: (book: Book) => void;
}

function InventoryCard({ book, isUpdating, onAddStock }: InventoryCardProps) {
  const isOutOfStock = book.stock === 0;
  const isCritical = book.stock > 0 && book.stock <= 2;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3">
      
      <div className="flex items-start gap-3">
        {/* Portada miniatura */}
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-12 h-16 object-cover rounded-lg shadow-sm border border-slate-200 shrink-0 bg-slate-100"
        />

        {/* Información del libro */}
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 inline-block">
            {book.category}
          </span>
          <h3 className="text-xs font-black text-slate-900 truncate leading-tight">
            {book.title}
          </h3>
          <p className="text-[11px] text-slate-500 truncate">Por {book.author}</p>
        </div>
      </div>

      {/* Estado del stock y botón rápido +5 */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Inventario</span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
              isOutOfStock
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : isCritical
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isOutOfStock ? '0 unidades' : `${book.stock} un.`}
          </span>
        </div>

        {/* Botón rápido +5 Stock */}
        <button
          onClick={() => onAddStock(book)}
          disabled={isUpdating}
          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
          title="Agregar 5 unidades de stock al instante"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isUpdating ? 'Guardando...' : '+5 Stock'}</span>
        </button>
      </div>

    </div>
  );
}
