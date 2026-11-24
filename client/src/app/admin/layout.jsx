'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { KanbanSquare, Package, ShieldAlert, ArrowLeft, Home, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const { isConnected } = useSocket();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Protección de rol ADMIN
  const isAuthorized = user?.role === 'ADMIN' || isAdmin;
  if (!user || !isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Acceso Restringido</h2>
        <p className="text-xs text-slate-500">
          Esta sección está reservada exclusivamente para usuarios con rol de Administrador.
        </p>
        <div className="pt-2">
          <a
            href="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition"
          >
            Iniciar sesión como Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">
                Book<span className="text-indigo-400">Flow</span> Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Panel de Control & Operaciones</p>
          </div>

          {/* Estado del WebSocket */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400" />
              )}
              <span className="font-semibold text-slate-300">Socket.IO Live</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isConnected ? 'Activo' : 'Conectando'}
            </span>
          </div>

          <nav className="space-y-1">
            <a
              href="/admin/kanban"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <KanbanSquare className="w-4 h-4 text-indigo-400" />
              <span>Tablero Kanban</span>
            </a>
            <a
              href="/admin/books"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Gestión de Inventario</span>
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </a>
        </div>
      </aside>

      {/* Contenido Principal Admin */}
      <div className="flex-1 overflow-x-auto p-4 sm:p-8">
        {children}
      </div>

    </div>
  );
}
