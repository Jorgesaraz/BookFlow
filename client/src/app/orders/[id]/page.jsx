'use client';

import React, { useState, useEffect, Suspense } from 'react';
import api from '../../../lib/api';
import { useSocket } from '../../../context/SocketContext';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  CreditCard,
  MapPin,
  ArrowLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';

function OrderDetailContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const paymentJustFinished = searchParams.get('payment') === 'success';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        console.error('Error cargando pedido:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  // Suscribirse a actualizaciones de Socket.IO en tiempo real
  useEffect(() => {
    if (!socket || !id) return;

    const handleOrderUpdate = (data) => {
      if (data.orderId === id) {
        setOrder(data.order);
      }
    };

    socket.on('order:status_updated', handleOrderUpdate);
    return () => socket.off('order:status_updated', handleOrderUpdate);
  }, [socket, id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Pedido no encontrado</h2>
        <a href="/orders" className="text-indigo-600 text-xs font-bold hover:underline">
          Volver a mis compras
        </a>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Pendiente de Pago', desc: 'Esperando confirmación' },
    { key: 'PAID', label: 'Pagado', desc: 'Pago verificado con PayPal' },
    { key: 'PROCESSING', label: 'En Preparación', desc: 'Empaquetando pedido' },
    { key: 'COMPLETED', label: 'Completado', desc: 'Entregado al cliente' },
  ];

  const getStepStatus = (stepKey) => {
    const orderIndex = steps.findIndex((s) => s.key === order.status);
    const stepIndex = steps.findIndex((s) => s.key === stepKey);
    if (order.status === 'CANCELLED') return 'cancelled';
    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Botón Volver */}
      <a
        href="/orders"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a mis compras</span>
      </a>

      {paymentJustFinished && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-sm">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>¡Gracias por tu compra! Tu pago fue capturado en PayPal Sandbox y el pedido está confirmado.</span>
        </div>
      )}

      {/* Header del Pedido */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-mono">
              ID del Pedido: #{order._id}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Estado: <span className="text-indigo-600">{order.status}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registrado el {new Date(order.createdAt).toLocaleString('es-ES')}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pagado</span>
            <span className="text-2xl font-black text-slate-900">${order.totalPrice.toFixed(2)}</span>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
              Método: {order.paymentMethod}
            </span>
          </div>
        </div>

        {/* Timeline Visual de Estados */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Línea de Tiempo del Pedido (Actualización en Vivo)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((st) => {
              const statusClass = getStepStatus(st.key);
              return (
                <div
                  key={st.key}
                  className={`p-3 rounded-2xl border text-center space-y-1 transition ${
                    statusClass === 'completed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : statusClass === 'current'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/30'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex justify-center">
                    {statusClass === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : statusClass === 'current' ? (
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="text-xs font-bold">{st.label}</div>
                  <div className="text-[10px] leading-tight">{st.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Artículos de la orden */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Artículos Comprados
          </h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <img src={item.coverImage} alt={item.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <span className="text-[11px] text-slate-500">{item.quantity} x ${item.price.toFixed(2)}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900">${(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dirección de Envío */}
        <div className="pt-4 border-t border-slate-100 flex items-start gap-3 text-xs">
          <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block">Dirección de Entrega:</span>
            <span className="text-slate-600">
              {order.shippingAddress.recipientName} • {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country} (Tel: {order.shippingAddress.phone})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-20 px-4 text-center text-xs text-slate-400">
        Cargando información del pedido...
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}
