const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Order = require('./models/Order');

const sampleCategories = [
  { name: 'Ciencia Ficción', slug: 'ciencia-ficcion', description: 'Novelas futuristas, viajes en el tiempo e IA.', icon: 'Rocket' },
  { name: 'Desarrollo de Software', slug: 'desarrollo-software', description: 'Programación, arquitectura y buenas prácticas.', icon: 'Code' },
  { name: 'Negocios y Emprendimiento', slug: 'negocios', description: 'Liderazgo, finanzas y estrategia empresarial.', icon: 'TrendingUp' },
  { name: 'Desarrollo Personal', slug: 'desarrollo-personal', description: 'Hábitos, productividad y bienestar.', icon: 'Compass' },
  { name: 'Fantasía Épica', slug: 'fantasia-epica', description: 'Mundos mágicos y aventuras legendarias.', icon: 'Sparkles' }
];

const sampleBooksData = [
  {
    title: 'Clean Code: Manual de estilo para el desarrollo ágil',
    author: 'Robert C. Martin',
    description: 'Incluso el código malo puede funcionar. Pero si no es limpio, puede acabar con una empresa de desarrollo. Cada año se pierden incontables horas por culpa del código mal estructurado.',
    isbn: '978-0132350884',
    price: 34.99,
    discountPrice: 29.99,
    stock: 25,
    categorySlug: 'desarrollo-software',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80',
    pages: 464,
    rating: 4.8,
    numReviews: 42,
    featured: true
  },
  {
    title: 'El Programador Pragmático',
    author: 'David Thomas & Andrew Hunt',
    description: 'El viaje hacia la maestría en el arte del código. Trata temas como la gestión de proyectos, filosofía de ingeniería, testing y arquitectura limpia.',
    isbn: '978-0135957059',
    price: 39.50,
    discountPrice: 35.00,
    stock: 18,
    categorySlug: 'desarrollo-software',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    pages: 352,
    rating: 4.9,
    numReviews: 56,
    featured: true
  },
  {
    title: 'Dune: La Obra Maestra de la Ciencia Ficción',
    author: 'Frank Herbert',
    description: 'En el desértico planeta Arrakis, la especia melange es la sustancia más codiciada del universo conocido. Quien controla la especia, controla el destino del imperio.',
    isbn: '978-0441172719',
    price: 24.90,
    discountPrice: 19.99,
    stock: 30,
    categorySlug: 'ciencia-ficcion',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    pages: 688,
    rating: 4.9,
    numReviews: 120,
    featured: true
  },
  {
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    description: 'Un marco comprobado para mejorar cada día en un 1%. Cambios pequeños que producen resultados extraordinarios en tu vida profesional y personal.',
    isbn: '978-0735211292',
    price: 21.50,
    discountPrice: 18.00,
    stock: 45,
    categorySlug: 'desarrollo-personal',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    pages: 320,
    rating: 4.8,
    numReviews: 95,
    featured: true
  },
  {
    title: 'De Cero a Uno: Cómo inventar el futuro',
    author: 'Peter Thiel',
    description: 'Notas sobre cómo crear empresas pioneras y construir monopolios creativos que transformen el mundo de la tecnología y los negocios.',
    isbn: '978-0804139298',
    price: 22.00,
    discountPrice: 0,
    stock: 14,
    categorySlug: 'negocios',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    pages: 224,
    rating: 4.6,
    numReviews: 34,
    featured: false
  },
  {
    title: 'El Nombre del Viento',
    author: 'Patrick Rothfuss',
    description: 'He robado princesas a reyes en el sueño. Incendié la ciudad de Trebon. He pasado la noche con Felurian y he despertado vivo y cuerdo. Me llaman Kvothe.',
    isbn: '978-0756404741',
    price: 27.50,
    discountPrice: 23.99,
    stock: 22,
    categorySlug: 'fantasia-epica',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    pages: 662,
    rating: 4.9,
    numReviews: 88,
    featured: true
  }
];

const seedData = async () => {
  try {
    console.log('[Seed] Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Conexión establecida.');

    // Limpiar colecciones
    await User.deleteMany();
    await Category.deleteMany();
    await Book.deleteMany();
    await Order.deleteMany();
    console.log('[Seed] Colecciones anteriores limpiadas.');

    // Crear usuarios de prueba
    const adminUser = await User.create({
      name: 'Admin BookFlow',
      email: 'admin@bookflow.com',
      password: 'adminpassword123',
      role: 'ADMIN',
      addresses: [{
        recipientName: 'Admin Principal',
        street: 'Av. Tecnológica 100',
        city: 'Ciudad Central',
        postalCode: '10001',
        country: 'EE.UU.',
        phone: '+1 800 555 0199',
        isDefault: true
      }]
    });

    const clientUser = await User.create({
      name: 'Carlos Lector',
      email: 'cliente@bookflow.com',
      password: 'clientepassword123',
      role: 'CLIENT',
      addresses: [{
        recipientName: 'Carlos Lector',
        street: 'Calle Falsa 123, Depto 4B',
        city: 'Springfield',
        postalCode: '90210',
        country: 'EE.UU.',
        phone: '+1 555 014 8833',
        isDefault: true
      }]
    });

    console.log(`[Seed] Usuarios creados:`);
    console.log(`  - ADMIN: admin@bookflow.com / adminpassword123`);
    console.log(`  - CLIENT: cliente@bookflow.com / clientepassword123`);

    // Crear categorías
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`[Seed] ${createdCategories.length} categorías creadas.`);

    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Crear libros
    const booksToInsert = sampleBooksData.map(b => ({
      title: b.title,
      author: b.author,
      description: b.description,
      isbn: b.isbn,
      price: b.price,
      discountPrice: b.discountPrice,
      stock: b.stock,
      category: categoryMap[b.categorySlug],
      coverImage: b.coverImage,
      pages: b.pages,
      rating: b.rating,
      numReviews: b.numReviews,
      featured: b.featured
    }));

    const createdBooks = await Book.insertMany(booksToInsert);
    console.log(`[Seed] ${createdBooks.length} libros insertados con éxito.`);

    // Crear una orden de ejemplo inicial para el tablero Kanban
    await Order.create({
      user: clientUser._id,
      items: [{
        book: createdBooks[0]._id,
        title: createdBooks[0].title,
        price: createdBooks[0].price,
        quantity: 1,
        coverImage: createdBooks[0].coverImage
      }],
      shippingAddress: clientUser.addresses[0],
      paymentMethod: 'PAYPAL',
      paymentResult: {
        id: 'PAYPAL_SAMPLE_998877',
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        email_address: clientUser.email
      },
      itemsPrice: createdBooks[0].price,
      shippingPrice: 5.00,
      totalPrice: createdBooks[0].price + 5.00,
      status: 'PAID',
      paidAt: new Date(),
      statusHistory: [
        { status: 'PENDING_PAYMENT', comment: 'Pedido creado' },
        { status: 'PAID', comment: 'Pago verificado con PayPal' }
      ]
    });

    console.log('[Seed] Pedido de ejemplo creado para el tablero Kanban.');
    console.log('✅ [Seed] Base de datos poblada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Error al poblar base de datos:', error.message);
    process.exit(1);
  }
};

seedData();
