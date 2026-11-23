'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  BookOpen,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  KanbanSquare,
  ShoppingCart
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

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
          <nav className="flex items-center gap-3 sm:gap-5">
            
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

                {/* Enlace Carrito con Badge */}
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

                {/* Enlace Carrito con Badge */}
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
