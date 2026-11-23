import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { SocketProvider } from '../context/SocketContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export const metadata = {
  title: 'BookFlow - Plataforma de Libros Electrónicos y Físicos',
  description: 'Descubre, compra y gestiona tus lecturas favoritas en tiempo real con BookFlow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-800">
        <AuthProvider>
          <CartProvider>
            <SocketProvider>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </SocketProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
