'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('CLIENT' | 'ADMIN')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 1. Si no hay sesión, redirigir a /login
      if (!user) {
        router.push('/login');
      }
      // 2. Si se especificaron roles permitidos y el usuario no lo tiene, redirigir a /
      else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push('/');
      }
    }
  }, [user, loading, allowedRoles, router]);

  // Pantalla de carga mientras se valida la sesión
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Verificando autorización...</p>
      </div>
    );
  }

  // Si no está autenticado o no tiene el rol, no renderizar los hijos (la redirección está en curso)
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
