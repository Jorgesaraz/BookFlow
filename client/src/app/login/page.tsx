'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Credenciales inválidas.');
    }
  };

  // Botones de acceso rápido para pruebas inmediatas
  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsSubmitting(true);
    const result = await login(demoEmail, demoPass);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Error al iniciar sesión con la cuenta demo.');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h1>
          <p className="text-xs text-slate-500">
            Ingresa a tu cuenta de BookFlow para continuar
          </p>
        </div>

        {/* Mensaje de Error Visible */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@bookflow.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
          >
            {isSubmitting ? (
              <span>Validando credenciales...</span>
            ) : (
              <>
                <span>Acceder</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Accesos Rápidos Demo */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Accesos Rápidos Demo
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('cliente@bookflow.com', 'clientepassword123')}
              disabled={isSubmitting}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Demo CLIENTE</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@bookflow.com', 'adminpassword123')}
              disabled={isSubmitting}
              className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-indigo-200 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Demo ADMIN</span>
            </button>
          </div>
        </div>

        {/* Enlace a Registro */}
        <p className="text-center text-xs text-slate-500 pt-1">
          ¿No tienes una cuenta aún?{' '}
          <Link href="/register" className="font-bold text-indigo-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>

      </div>
    </div>
  );
}
