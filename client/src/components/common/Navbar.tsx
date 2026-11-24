'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import {
  BookOpen,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  KanbanSquare,
  ShoppingCart,
  Package,
  Bell,
  X,
  CheckCheck,
  Trash2
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useSocket();

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setBellOpen((prev) => !prev);
    if (!bellOpen && unreadCount > 0) markAllAsRead();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo / Marca */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md group-hover:bg-indigo-700 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                Book<span className="text-indigo-600">Flow</span>
              </span>
            </div>
          </Link>

          {/* Navegación y Estado de Autenticación */}
          <nav className="flex items-center gap-3 sm:gap-4">

            {!user ? (
              /* Estado 1: Sin sesión */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="text-xs sm:text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition"
                >
                  Registrarse
                </Link>
              </div>
            ) : user.role === 'ADMIN' ? (
              /* Estado 2: Rol ADMIN */
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {user.name}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    ADMIN
                  </span>
                </div>

                <Link
                  href="/admin/books"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200/60 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Gestionar Catálogo</span>
                </Link>

                <Link
                  href="/admin/kanban"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
                >
                  <KanbanSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Tablero Kanban</span>
                </Link>

                {/* Enlace Mis Compras */}
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Mis Compras</span>
                </Link>

                {/* Carrito */}
                <Link
                  href="/cart"
                  className="relative inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
                  title="Carrito de compras"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Carrito</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* 🔔 Campana de notificaciones — solo ADMIN */}
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={handleBellClick}
                    className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
                    title="Notificaciones"
                    aria-label="Notificaciones"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Panel de notificaciones */}
                  {bellOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      {/* Header panel */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <span className="text-xs font-extrabold text-slate-700">
                          Notificaciones
                          {notifications.length > 0 && (
                            <span className="ml-1.5 text-slate-400 font-semibold">({notifications.length})</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          {notifications.length > 0 && (
                            <>
                              <button
                                onClick={markAllAsRead}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition"
                                title="Marcar todas como leídas"
                              >
                                <CheckCheck className="w-3 h-3" />
                                Leídas
                              </button>
                              <button
                                onClick={clearNotifications}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                                title="Limpiar notificaciones"
                              >
                                <Trash2 className="w-3 h-3" />
                                Limpiar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setBellOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lista de notificaciones */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-medium">Sin notificaciones recientes</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 flex items-start gap-3 transition ${!n.read ? 'bg-indigo-50/50' : ''}`}
                            >
                              <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                                n.type === 'order'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-amber-100 text-amber-600'
                              }`}>
                                {n.type === 'order' ? '🛒' : '⚠️'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-extrabold text-slate-800 leading-tight">{n.title}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-[9px] text-slate-300 mt-1 font-medium">
                                  {new Date(n.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              /* Estado 3: Rol CLIENT */
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">{user.name}</span>
                </div>

                <Link
                  href="/"
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  Catálogo
                </Link>

                {/* Enlace Mis Compras */}
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Mis Compras</span>
                </Link>

                {/* Carrito con Badge */}
                <Link
                  href="/cart"
                  className="relative inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
                  title="Carrito de compras"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Carrito</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}

          </nav>

        </div>
      </div>
    </header>
  );
}
