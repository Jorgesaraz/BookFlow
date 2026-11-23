'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error('Error cargando pedidos:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-xl font-black text-slate-800">Inicia sesión</h2>
        <p className="text-xs text-slate-500">Accede con tu cuenta para ver el historial de pedidos.</p>
        <a href="/login" className="inline-block bg-indigo-600 text-white text-xs font-bold py-2.5 px-6 rounded-xl">
          Iniciar Sesión
        </a>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pendiente de Pago</span>;
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pagado</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">En Preparación</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Completado</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Compras</h1>
        <p className="text-xs text-slate-500 mt-1">Revisa el estado y los detalles de todos tus pedidos.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-28"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Aún no tienes pedidos registrados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cuando realices una compra de libros, aparecerá aquí con su estado y seguimiento en vivo.
          </p>
          <a
            href="/books"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition"
          >
            Comenzar a comprar
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <a
              key={order._id}
              href={`/orders/${order._id}`}
              className="group block bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-indigo-500/50 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Pedido #{order._id.substring(order._id.length - 8).toUpperCase()}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Fecha: {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.coverImage}
                        alt={item.title}
                        className="w-8 h-10 object-cover rounded shadow-xs"
                      />
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-slate-400 font-semibold">+{order.items.length - 3} más</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="text-lg font-black text-slate-900">${order.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition mt-2">
                    <span>Ver detalles</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
