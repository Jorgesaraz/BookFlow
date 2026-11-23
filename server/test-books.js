const Book = require('./src/models/Book');
const { getBooks, getCategories, getBookById, createBook, updateBook, deleteBook } = require('./src/controllers/bookController');

console.log('🧪 [TEST] Verificando especificaciones de Book Model y Controlador...');

// 1. Verificación del Schema de Book
try {
  const schema = Book.schema.paths;

  // Campos obligatorios
  const requiredFields = ['title', 'author', 'category', 'description', 'price', 'stock', 'coverImage', 'digitalFile'];
  for (const field of requiredFields) {
    if (!schema[field]) throw new Error(`Campo faltante: ${field}`);
    if (!schema[field].isRequired) throw new Error(`Campo ${field} debe ser obligatorio`);
  }

  // category debe ser String
  if (schema.category.instance !== 'String') {
    throw new Error(`category debe ser String, se encontró ${schema.category.instance}`);
  }

  // digitalFile debe tener select: false
  if (schema.digitalFile.options.select !== false) {
    throw new Error('digitalFile debe tener select: false (CRÍTICO)');
  }

  // availability debe ser Boolean con default true
  if (schema.availability.instance !== 'Boolean' || schema.availability.options.default !== true) {
    throw new Error('availability debe ser Boolean con default true');
  }

  // stock min 0 y default 0
  if (schema.stock.options.min[0] !== 0 || schema.stock.options.default !== 0) {
    throw new Error('stock debe tener min 0 y default 0');
  }

  console.log('✅ 1. Schema de Book (campos, tipos, select:false en digitalFile): OK');
} catch (e) {
  console.error('❌ Error en test Schema de Book:', e.message);
  process.exit(1);
}

// 2. Verificación de cálculo de availability en pre-save
try {
  const bookInStock = new Book({
    title: 'Libro A',
    author: 'Autor A',
    category: 'Programación',
    description: 'Desc A',
    price: 20,
    stock: 5,
    coverImage: 'http://img.com',
    digitalFile: 'http://file.com'
  });

  // Localizar el hook pre-save de availability (anónimo o con lógica de disponibilidad)
  const preSaveHooks = Book.schema.s.hooks._pres.get('save');
  const customHookObj = preSaveHooks.find(h => !h.fn.name || h.fn.name === 'anonymous' || h.fn.toString().includes('availability'));
  if (!customHookObj) throw new Error('No se encontró el hook pre-save de availability');
  const preSaveHook = customHookObj.fn;

  preSaveHook.call(bookInStock, () => {});
  if (bookInStock.availability !== true) throw new Error('availability debería ser true con stock > 0');

  const bookOutOfStock = new Book({
    title: 'Libro B',
    author: 'Autor B',
    category: 'Programación',
    description: 'Desc B',
    price: 20,
    stock: 0,
    coverImage: 'http://img.com',
    digitalFile: 'http://file.com'
  });
  preSaveHook.call(bookOutOfStock, () => {});
  if (bookOutOfStock.availability !== false) throw new Error('availability debería ser false con stock === 0');

  console.log('✅ 2. Lógica de cálculo automático de availability (true si stock > 0, false si stock === 0): OK');
} catch (e) {
  console.error('❌ Error en test hook availability:', e.message);
  process.exit(1);
}

// 3. Verificación de controladores exportados
try {
  if (typeof getBooks !== 'function') throw new Error('getBooks no es función');
  if (typeof getCategories !== 'function') throw new Error('getCategories no es función');
  if (typeof getBookById !== 'function') throw new Error('getBookById no es función');
  if (typeof createBook !== 'function') throw new Error('createBook no es función');
  if (typeof updateBook !== 'function') throw new Error('updateBook no es función');
  if (typeof deleteBook !== 'function') throw new Error('deleteBook no es función');

  const bookRoutes = require('./src/routes/bookRoutes');
  if (!bookRoutes) throw new Error('bookRoutes no cargó correctamente');

  console.log('✅ 3. Controlador y rutas de Book (/api/books): OK');
} catch (e) {
  console.error('❌ Error en test Controlador/Rutas:', e.message);
  process.exit(1);
}

console.log('🎉 TODOS LOS TESTS DE BOOK Y CATÁLOGO PASARON EXITOSAMENTE.');
