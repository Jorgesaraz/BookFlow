const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const {
  generateAccessToken,
  createPayPalOrder,
  capturePayPalOrder
} = require('./src/services/paypalService');
const {
  createPayPalOrderEndpoint,
  capturePayPalOrderEndpoint,
  getMyOrdersEndpoint,
  getOrderByIdEndpoint
} = require('./src/controllers/orderController');

console.log('🧪 [TEST] Verificando especificaciones de Order Model, Servicio PayPal y Controlador...');

// 1. Verificación del Schema de Order
try {
  const schema = Order.schema.paths;

  // Campo user requerido, ObjectId y ref 'User'
  if (!schema.user) throw new Error('Campo user no existe en Order schema');
  if (!schema.user.isRequired) throw new Error('Campo user debe ser obligatorio');
  if (schema.user.instance !== 'ObjectId') throw new Error('Campo user debe ser ObjectId');
  if (schema.user.options.ref !== 'User') throw new Error('Campo user debe tener ref User');

  // Items subdocumentos
  if (!schema['items']) throw new Error('Campo items no existe en Order schema');

  // Subcampos de items
  const itemBook = Order.schema.path('items.book');
  if (!itemBook || itemBook.instance !== 'ObjectId' || itemBook.options.ref !== 'Book') {
    throw new Error('items.book debe ser ObjectId con ref Book');
  }

  const itemTitle = Order.schema.path('items.title');
  if (!itemTitle || itemTitle.instance !== 'String' || !itemTitle.isRequired) {
    throw new Error('items.title debe ser String y obligatorio');
  }

  const itemPrice = Order.schema.path('items.price');
  if (!itemPrice || itemPrice.instance !== 'Number' || !itemPrice.isRequired) {
    throw new Error('items.price debe ser Number y obligatorio');
  }

  const itemQuantity = Order.schema.path('items.quantity');
  if (!itemQuantity || itemQuantity.instance !== 'Number' || itemQuantity.options.min[0] !== 1) {
    throw new Error('items.quantity debe ser Number con min 1');
  }

  // totalAmount
  if (!schema.totalAmount || schema.totalAmount.instance !== 'Number' || !schema.totalAmount.isRequired) {
    throw new Error('totalAmount debe ser Number y obligatorio');
  }

  // status enum ['PENDING', 'COMPLETED', 'FAILED']
  if (!schema.status) throw new Error('status debe existir');
  const allowedStatuses = schema.status.enumValues;
  if (!allowedStatuses.includes('PENDING') || !allowedStatuses.includes('COMPLETED') || !allowedStatuses.includes('FAILED')) {
    throw new Error(`status enum debe contener PENDING, COMPLETED, FAILED. Se encontró: ${allowedStatuses}`);
  }
  if (schema.status.options.default !== 'PENDING') {
    throw new Error('status default debe ser PENDING');
  }

  // paypalOrderId unique
  if (!schema.paypalOrderId || schema.paypalOrderId.instance !== 'String' || !schema.paypalOrderId.isRequired) {
    throw new Error('paypalOrderId debe ser String y obligatorio');
  }
  if (!schema.paypalOrderId.options.unique) {
    throw new Error('paypalOrderId debe tener unique: true');
  }

  // paypalCaptureId y paidAt
  if (!schema.paypalCaptureId || schema.paypalCaptureId.instance !== 'String') {
    throw new Error('paypalCaptureId debe ser String');
  }
  if (!schema.paidAt || schema.paidAt.instance !== 'Date') {
    throw new Error('paidAt debe ser Date');
  }

  // Timestamps
  if (!schema.createdAt || !schema.updatedAt) {
    throw new Error('Order schema debe tener timestamps: true');
  }

  console.log('✅ 1. Schema de Order (user, items snapshots, totalAmount, status enum, paypalOrderId unique, timestamps): OK');
} catch (e) {
  console.error('❌ Error en test Schema de Order:', e.message);
  process.exit(1);
}

// 2. Verificación del Servicio de PayPal
try {
  if (typeof generateAccessToken !== 'function') throw new Error('generateAccessToken no es función');
  if (typeof createPayPalOrder !== 'function') throw new Error('createPayPalOrder no es función');
  if (typeof capturePayPalOrder !== 'function') throw new Error('capturePayPalOrder no es función');

  console.log('✅ 2. Servicio de PayPal (generateAccessToken, createPayPalOrder, capturePayPalOrder): OK');
} catch (e) {
  console.error('❌ Error en test Servicio PayPal:', e.message);
  process.exit(1);
}

// 3. Verificación de controladores y rutas
try {
  if (typeof createPayPalOrderEndpoint !== 'function') throw new Error('createPayPalOrderEndpoint no es función');
  if (typeof capturePayPalOrderEndpoint !== 'function') throw new Error('capturePayPalOrderEndpoint no es función');
  if (typeof getMyOrdersEndpoint !== 'function') throw new Error('getMyOrdersEndpoint no es función');
  if (typeof getOrderByIdEndpoint !== 'function') throw new Error('getOrderByIdEndpoint no es función');

  const orderRoutes = require('./src/routes/orderRoutes');
  if (!orderRoutes) throw new Error('orderRoutes no cargó correctamente');

  console.log('✅ 3. Controlador y rutas de Order (/api/orders): OK');
} catch (e) {
  console.error('❌ Error en test Controlador/Rutas de Order:', e.message);
  process.exit(1);
}

// 4. Instanciación de prueba de orden
try {
  const dummyOrder = new Order({
    user: new mongoose.Types.ObjectId(),
    items: [
      {
        book: new mongoose.Types.ObjectId(),
        title: 'Clean Code en TypeScript',
        price: 29.99,
        quantity: 2
      }
    ],
    totalAmount: 59.98,
    paypalOrderId: 'TEST_ORDER_12345'
  });

  if (dummyOrder.status !== 'PENDING') throw new Error('Default status debe ser PENDING');
  if (dummyOrder.totalAmount !== 59.98) throw new Error('totalAmount no coincide');
  if (dummyOrder.items[0].title !== 'Clean Code en TypeScript') throw new Error('Snapshot de título incorrecto');

  console.log('✅ 4. Creación e inicialización de instancia de Order: OK');
} catch (e) {
  console.error('❌ Error en test instanciación Order:', e.message);
  process.exit(1);
}

console.log('🎉 TODOS LOS TESTS DE ORDER Y PAYPAL PASARON EXITOSAMENTE.');
