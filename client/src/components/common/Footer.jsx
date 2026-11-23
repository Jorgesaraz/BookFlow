import React from 'react';
import { BookOpen, ShieldCheck, Heart, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Book<span className="text-indigo-400">Flow</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma integral de comercio electrónico de libros con sincronización en tiempo real, catálogo optimizado y pagos seguros.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-3">Explorar</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/books" className="hover:text-white transition">Todos los Libros</a></li>
              <li><a href="/books?category=ciencia-ficcion" className="hover:text-white transition">Ciencia Ficción</a></li>
              <li><a href="/books?category=desarrollo-software" className="hover:text-white transition">Programación</a></li>
              <li><a href="/books?category=desarrollo-personal" className="hover:text-white transition">Desarrollo Personal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-3">Seguridad & Pagos</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Transacciones Sandbox Seguras</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Autenticación Cifrada JWT</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Sincronización WebSockets</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-3">Newsletter</h4>
            <p className="text-xs text-slate-400 mb-3">Suscríbete para recibir lanzamientos y ofertas exclusivas.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 w-full text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition">
                Enviar
              </button>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BookFlow Inc. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 mt-2 md:mt-0">
            <span>Hecho con dedicación y arquitectura escalable</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
