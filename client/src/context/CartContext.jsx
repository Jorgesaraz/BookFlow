'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bookflow_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Error al cargar carrito:', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('bookflow_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = (book, quantity = 1) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.book === book._id);
      if (existing) {
        return prevItems.map((item) =>
          item.book === book._id
            ? { ...item, quantity: Math.min(item.quantity + quantity, book.stock) }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            book: book._id,
            title: book.title,
            price: book.discountPrice > 0 ? book.discountPrice : book.price,
            coverImage: book.coverImage,
            stock: book.stock,
            quantity: Math.min(quantity, book.stock)
          }
        ];
      }
    });
  };

  const updateQuantity = (bookId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.book === bookId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  const removeFromCart = (bookId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.book !== bookId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingPrice = itemsPrice > 50 || itemsPrice === 0 ? 0 : 4.99; // Envío gratis en compras mayores a $50
  const totalPrice = itemsPrice + shippingPrice;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemsCount,
        itemsPrice,
        shippingPrice,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
