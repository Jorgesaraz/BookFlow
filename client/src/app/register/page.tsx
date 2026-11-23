'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Lock, Mail, User, ArrowRight, AlertCircle, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  // Reglas de validación de seguridad de contraseña
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!isPasswordValid) {
      setError('Por favor asegúrate de cumplir con todos los requisitos de seguridad de la contraseña.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name, email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Error al crear la cuenta.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Crear Cuenta</h1>
          <p className="text-xs text-slate-500">
            Únete a BookFlow y accede al catálogo de libros
          </p>
        </div>

        {/* Error Visible */}
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
              Nombre Completo
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

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
                placeholder="juan@ejemplo.com"
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
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {/* Requisitos Visuales de Contraseña */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-600 block mb-1">Requisitos de seguridad:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${hasUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Una mayúscula</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${hasLowercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Una minúscula</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Un número</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm mt-2"
          >
            {isSubmitting ? (
              <span>Creando tu cuenta...</span>
            ) : (
              <>
                <span>Registrarse</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Enlace a Login */}
        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  );
}
