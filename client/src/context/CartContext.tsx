'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import api from '../lib/api';

export interface CartBook {
  _id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  availability: boolean;
  coverImage: string;
}

export interface CartItem {
  _id?: string;
  book: CartBook;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  loading: boolean;
  addToCart: (bookId: string, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (bookId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (bookId: string) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  totalItems: 0,
  subtotal: 0,
  loading: false,
  addToCart: async () => ({ success: false }),
  updateQuantity: async () => ({ success: false }),
  removeFromCart: async () => ({ success: false }),
  clearCart: async () => ({ success: false }),
  refreshCart: async () => {}
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Consulta el carrito activo del usuario autenticado
  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/cart');
      if (res.data.success || res.data.items !== undefined) {
        const fetchedItems = res.data.items || res.data.data?.items || [];
        const fetchedTotal = res.data.totalItems ?? res.data.data?.totalItems ?? 0;
        const fetchedSubtotal = res.data.subtotal ?? res.data.data?.subtotal ?? 0;

        setItems(fetchedItems);
        setTotalItems(fetchedTotal);
        setSubtotal(fetchedSubtotal);
      }
    } catch (err: any) {
      console.error('Error al sincronizar carrito desde el servidor:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sincronizar automáticamente al iniciar sesión o limpiar al cerrar sesión
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
    }
  }, [user, refreshCart]);

  // Agregar producto al carrito
  const addToCart = async (
    bookId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; message?: string }> => {
    // Si no está autenticado, redirigir a /login
    if (!user) {
      router.push('/login');
      return { success: false, message: 'Debes iniciar sesión para agregar productos al carrito.' };
    }

    try {
      const res = await api.post('/cart/items', {
        bookId,
        quantity
      });

      if (res.data.success || res.data.items) {
        const updatedItems = res.data.items || res.data.data?.items || [];
        const updatedTotal = res.data.totalItems ?? res.data.data?.totalItems ?? 0;
        const updatedSubtotal = res.data.subtotal ?? res.data.data?.subtotal ?? 0;

        setItems(updatedItems);
        setTotalItems(updatedTotal);
        setSubtotal(updatedSubtotal);

        return { success: true, message: res.data.message || 'Libro agregado al carrito.' };
      }
      return { success: false, message: res.data.message || 'No se pudo agregar el libro.' };
    } catch (err: any) {
      console.error('Error al agregar al carrito:', err);
      const msg = err.response?.data?.message || 'Error al agregar producto al carrito.';
      return { success: false, message: msg };
    }
  };

  // Actualizar cantidad de un producto
  const updateQuantity = async (
    bookId: string,
    quantity: number
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    try {
      const res = await api.put(`/cart/items/${bookId}`, { quantity });

      if (res.data.success || res.data.items) {
        const updatedItems = res.data.items || res.data.data?.items || [];
        const updatedTotal = res.data.totalItems ?? res.data.data?.totalItems ?? 0;
        const updatedSubtotal = res.data.subtotal ?? res.data.data?.subtotal ?? 0;

        setItems(updatedItems);
        setTotalItems(updatedTotal);
        setSubtotal(updatedSubtotal);

        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      console.error('Error al actualizar cantidad:', err);
      const msg = err.response?.data?.message || 'Error al actualizar cantidad.';
      return { success: false, message: msg };
    }
  };

  // Eliminar un producto del carrito
  const removeFromCart = async (bookId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    try {
      const res = await api.delete(`/cart/items/${bookId}`);

      if (res.data.success || res.data.items) {
        const updatedItems = res.data.items || res.data.data?.items || [];
        const updatedTotal = res.data.totalItems ?? res.data.data?.totalItems ?? 0;
        const updatedSubtotal = res.data.subtotal ?? res.data.data?.subtotal ?? 0;

        setItems(updatedItems);
        setTotalItems(updatedTotal);
        setSubtotal(updatedSubtotal);

        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      console.error('Error al eliminar producto del carrito:', err);
      const msg = err.response?.data?.message || 'Error al remover producto.';
      return { success: false, message: msg };
    }
  };

  // Vaciar carrito
  const clearCart = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    try {
      const res = await api.delete('/cart');
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      return { success: true, message: res.data?.message || 'Carrito vaciado exitosamente.' };
    } catch (err: any) {
      console.error('Error al vaciar carrito:', err);
      const msg = err.response?.data?.message || 'Error al vaciar carrito.';
      return { success: false, message: msg };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
