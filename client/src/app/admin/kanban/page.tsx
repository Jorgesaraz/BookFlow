'use client';

import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { KanbanSquare, ShieldCheck, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminKanbanPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Navegación de regreso */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>

        {/* Card Placeholder con Control de Acceso Verificado */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100 shadow-inner">
            <KanbanSquare className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Acceso Autorizado: Rol ADMIN Verificado</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tablero Kanban Administrativo - Próximamente en Fase 10
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              El control de acceso por roles (RBAC) está funcionando correctamente. Esta vista está protegida y solo es accesible para usuarios con rol de Administrador.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Integración en tiempo real con Socket.IO y PayPal lista para activarse</span>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
