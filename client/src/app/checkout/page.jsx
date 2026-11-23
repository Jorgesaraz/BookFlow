'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { ShieldCheck, MapPin, CreditCard, CheckCircle, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';

export default function CheckoutPage() {
  const { user, addAddress } = useAuth();
  const { cartItems, itemsPrice, shippingPrice, totalPrice, clearCart } = useCart();
  const router = useRouter();

  // Estados de dirección
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('EE.UU.');
  const [phone, setPhone] = useState('+1 555-0199');

  // Estados de pago y orden
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderCreated, setOrderCreated] = useState(null);

  // Inicializar dirección si el usuario ya tiene una guardada
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setRecipientName(def.recipientName || user.name);
      setStreet(def.street || '');
      setCity(def.city || '');
      setState(def.state || '');
      setPostalCode(def.postalCode || '');
      setCountry(def.country || 'EE.UU.');
      setPhone(def.phone || '');
    } else if (user) {
      setRecipientName(user.name);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-xl font-black text-slate-800">Inicia sesión para continuar</h2>
        <p className="text-xs text-slate-500">
          Debes estar autenticado para registrar tu dirección y completar el pedido.
        </p>
        <a
          href="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderCreated) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-xl font-black text-slate-800">No hay artículos para procesar</h2>
        <a href="/books" className="text-indigo-600 text-xs font-bold hover:underline">
          Regresar a la tienda
        </a>
      </div>
    );
  }

  const handleCreateAndPay = async (isSandboxSimulation = false) => {
    setErrorMsg('');
    if (!street || !city || !postalCode || !phone) {
      setErrorMsg('Por favor completa todos los campos de la dirección de envío');
      return;
    }

    setIsProcessing(true);
    try {
      const shippingAddress = { recipientName, street, city, state, postalCode, country, phone };

      // 1. Crear la orden en BookFlow en estado PENDING_PAYMENT
      const orderPayload = {
        items: cartItems.map((item) => ({
          book: item.book,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          coverImage: item.coverImage,
        })),
        shippingAddress,
        itemsPrice,
        shippingPrice,
        totalPrice,
      };

      const orderRes = await api.post('/orders', orderPayload);
      const newOrder = orderRes.data.data;
      setOrderCreated(newOrder);

      // 2. Iniciar flujo de PayPal Sandbox
      const payRes = await api.post('/payments/paypal/create-order', {
        orderId: newOrder._id,
      });

      const paypalOrderId = payRes.data.paypalOrderId;

      // 3. Capturar el pago en PayPal Sandbox (confirmación server-side)
      const captureRes = await api.post('/payments/paypal/capture-order', {
        orderId: newOrder._id,
        paypalOrderId: paypalOrderId,
      });

      // 4. Limpiar carrito y redirigir al detalle del pedido
      clearCart();
      router.push(`/orders/${newOrder._id}?payment=success`);
    } catch (err) {
      console.error('Error procesando checkout:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error procesando la orden');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finalizar Compra</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa la dirección de envío y confirma el pago con PayPal Sandbox.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Formulario de Dirección de Envío */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">Dirección de Envío</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Nombre del Destinatario</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="Nombre completo"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Dirección / Calle y Número</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="Av. Principal 123, Depto 4"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Ciudad</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="Ciudad"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Estado / Provincia</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="Estado"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Código Postal</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="+1 555-0100"
              />
            </div>
          </div>
        </div>

        {/* Resumen & Botón de PayPal */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">Resumen del Pedido</h2>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {cartItems.map((item) => (
              <div key={item.book} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-600">{item.quantity}x</span>
                  <span className="text-slate-800 line-clamp-1 max-w-[140px]">{item.title}</span>
                </div>
                <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Envío</span>
              <span className="font-semibold text-slate-900">
                {shippingPrice === 0 ? <span className="text-emerald-600 font-bold">Gratis</span> : `$${shippingPrice.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total a Pagar</span>
              <span className="text-indigo-600 text-lg">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Botón de Pago PayPal Sandbox */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCreateAndPay(false)}
              className="w-full bg-[#ffc439] hover:bg-[#f4bb36] text-slate-900 font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              <span>{isProcessing ? 'Procesando con PayPal...' : 'Pagar con PayPal Sandbox'}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Transacción encriptada y segura</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
