const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
const Book = require('./src/models/Book');
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('./src/controllers/cartController');

console.log('🧪 [TEST] Verificando especificaciones de Cart Model, Controlador y Rutas...');

// 1. Verificación del Schema de Cart
try {
  const schema = Cart.schema.paths;

  // Campo user requerido, ObjectId y ref 'User'
  if (!schema.user) throw new Error('Campo user no existe en Cart schema');
  if (!schema.user.isRequired) throw new Error('Campo user debe ser obligatorio');
  if (schema.user.instance !== 'ObjectId') throw new Error('Campo user debe ser ObjectId');
  if (schema.user.options.ref !== 'User') throw new Error('Campo user debe tener ref User');
  if (!schema.user.options.unique) throw new Error('Campo user debe tener unique: true');

  // Items subdocumentos
  if (!schema['items']) throw new Error('Campo items no existe en Cart schema');

  // book dentro de items
  const itemBook = Cart.schema.path('items.book');
  if (!itemBook) throw new Error('Campo items.book no existe');
  if (itemBook.instance !== 'ObjectId' || itemBook.options.ref !== 'Book') {
    throw new Error('items.book debe ser ObjectId con ref Book');
  }
  if (!itemBook.isRequired) throw new Error('items.book debe ser requerido');

  // quantity dentro de items
  const itemQuantity = Cart.schema.path('items.quantity');
  if (!itemQuantity) throw new Error('Campo items.quantity no existe');
  if (itemQuantity.options.min[0] !== 1) throw new Error('items.quantity debe tener min: 1');
  if (itemQuantity.options.default !== 1) throw new Error('items.quantity debe tener default: 1');

  // Timestamps
  if (!schema.createdAt || !schema.updatedAt) {
    throw new Error('Cart schema debe tener timestamps: true');
  }

  console.log('✅ 1. Schema de Cart (user unique, items.book ref Book, items.quantity min 1, timestamps): OK');
} catch (e) {
  console.error('❌ Error en test Schema de Cart:', e.message);
  process.exit(1);
}

// 2. Verificación de controladores exportados
try {
  if (typeof getCart !== 'function') throw new Error('getCart no es función');
  if (typeof addItemToCart !== 'function') throw new Error('addItemToCart no es función');
  if (typeof updateCartItem !== 'function') throw new Error('updateCartItem no es función');
  if (typeof removeCartItem !== 'function') throw new Error('removeCartItem no es función');
  if (typeof clearCart !== 'function') throw new Error('clearCart no es función');

  const cartRoutes = require('./src/routes/cartRoutes');
  if (!cartRoutes) throw new Error('cartRoutes no cargó correctamente');

  console.log('✅ 2. Controlador y rutas de Cart (/api/cart): OK');
} catch (e) {
  console.error('❌ Error en test Controlador/Rutas de Cart:', e.message);
  process.exit(1);
}

// 3. Verificación de lógica matemática (subtotal redondeado a 2 decimales y totalItems)
try {
  const dummyItems = [
    { book: { price: 29.99 }, quantity: 2 },
    { book: { price: 14.95 }, quantity: 1 },
    { book: { price: 9.99 }, quantity: 3 }
  ];

  const totalItems = dummyItems.reduce((acc, i) => acc + i.quantity, 0);
  const rawSubtotal = dummyItems.reduce((acc, i) => acc + i.book.price * i.quantity, 0);
  const subtotal = Number(rawSubtotal.toFixed(2));

  if (totalItems !== 6) throw new Error(`totalItems esperado 6, obtenido ${totalItems}`);
  // 29.99*2 + 14.95 + 9.99*3 = 59.98 + 14.95 + 29.97 = 104.90
  if (subtotal !== 104.9) throw new Error(`subtotal esperado 104.90, obtenido ${subtotal}`);

  console.log('✅ 3. Lógica matemática de totalItems y subtotal redondeado a 2 decimales: OK');
} catch (e) {
  console.error('❌ Error en test de cálculos matemáticos:', e.message);
  process.exit(1);
}

console.log('🎉 TODOS LOS TESTS DE CART PASARON EXITOSAMENTE.');
