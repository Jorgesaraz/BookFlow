import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env de server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.MONGO_URI) {
  dotenv.config();
}

import User from '../models/User';
import Book from '../models/Book';

interface SeedUserData {
  name: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'ADMIN';
}

interface SeedBookData {
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  coverImage: string;
  digitalFile: string;
  availability: boolean;
}

// 1. Usuarios demo del sistema (Conservados intactos)
const demoUsers: SeedUserData[] = [
  {
    name: 'Admin BookFlow',
    email: 'admin@bookflow.com',
    password: 'adminpassword123',
    role: 'ADMIN'
  },
  {
    name: 'Cliente Demo',
    email: 'cliente@bookflow.com',
    password: 'clientepassword123',
    role: 'CLIENT'
  }
];

// 2. Catálogo inicial de 8 libros electrónicos variados
const initialBooks: SeedBookData[] = [
  {
    title: 'Clean Code en TypeScript: Guía Práctica para Desarrolladores Modernos',
    author: 'Carlos Mendoza',
    category: 'Programación',
    description:
      'Aprende a escribir código TypeScript limpio, modular y mantenible. Incluye patrones de diseño, refactorización avanzada, principios SOLID y pruebas unitarias con Jest.',
    price: 29.99,
    stock: 15,
    coverImage: 'https://images.unsplash.com/photo-1516116211227-bbc03a2298bc?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/clean-code-typescript.pdf',
    availability: true
  },
  {
    title: 'Microservicios y Sistemas Distribuidos: De Cero a Producción',
    author: 'Elena Rostova',
    category: 'Arquitectura de Software',
    description:
      'Diseña arquitecturas escalables y resilientes con microservicios, eventos con Kafka, comunicación gRPC, orquestación con Kubernetes y patrones de resiliencia como Circuit Breaker.',
    price: 39.99,
    stock: 10,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/microservicios-sistemas-distribuidos.pdf',
    availability: true
  },
  {
    title: 'Deep Learning y Modelos Generativos con PyTorch',
    author: 'David K. Vance',
    category: 'Inteligencia Artificial',
    description:
      'Explora los fundamentos y aplicaciones prácticas de redes neuronales profundas, arquitecturas Transformers, LLMs y modelos de difusión generativa con implementaciones completas en PyTorch.',
    price: 44.99,
    stock: 8,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/deep-learning-modelos-generativos.pdf',
    availability: true
  },
  {
    title: 'Diseño de Interfaces Centrado en el Usuario y Sistemas de Diseño',
    author: 'Mariana Silva',
    category: 'Diseño UX/UI',
    description:
      'Estrategias completas para investigar, prototipar y construir sistemas de diseño escalables con Figma. Métricas de usabilidad, accesibilidad WCAG y experiencia de usuario moderna.',
    price: 24.99,
    stock: 18,
    coverImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/diseno-ux-ui-sistemas.pdf',
    availability: true
  },
  {
    title: 'De Idea a Startup SaaS: Estrategia, Métricas y Escalamiento',
    author: 'Roberto Gómez',
    category: 'Negocios',
    description:
      'Manual para fundadores tecnológicos: validación de producto, pricing B2B, métricas clave (CAC, LTV, Churn, ARR), levantamiento de capital y growth loops para plataformas SaaS.',
    price: 19.99,
    stock: 22,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/idea-a-startup-saas.pdf',
    availability: true
  },
  {
    title: 'Full Stack Next.js y React Moderno con Tailwind CSS',
    author: 'Andrés Navarro',
    category: 'Programación',
    description:
      'Construye aplicaciones web de alto rendimiento con Next.js App Router, Server Actions, optimización SEO, autenticación robusta y diseño responsivo utilizando Tailwind CSS.',
    price: 34.99,
    stock: 12,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/fullstack-nextjs-react.pdf',
    availability: true
  },
  {
    title: 'Cloud Native & DevOps: Automatización Continua con Docker y Kubernetes',
    author: 'Laura Benítez',
    category: 'Arquitectura de Software',
    description:
      'Guía exhaustiva de integración y despliegue continuo (CI/CD), infraestructura como código con Terraform, contenedores Docker y monitoreo en tiempo real con Prometheus y Grafana.',
    price: 29.99,
    stock: 7,
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/cloud-native-devops.pdf',
    availability: true
  },
  {
    title: 'Fundamentos de Redes Neuronales y Machine Learning Matemático',
    author: 'Dr. Víctor Hernández',
    category: 'Inteligencia Artificial',
    description:
      'Edición especial de coleccionista sobre álgebra lineal, cálculo multivariable y probabilidad aplicados a redes neuronales. Ejemplos teóricos y derivaciones matemáticas rigurosas. (Agotado)',
    price: 49.99,
    stock: 0,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    digitalFile: 'https://storage.bookflow.local/ebooks/fundamentos-redes-neuronales-matematico.pdf',
    availability: false
  }
];

const seedDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bookflow';

  try {
    console.log(`🔄 Conectando a MongoDB (${mongoUri.replace(/:([^:@]+)@/, ':****@')})...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Conexión establecida exitosamente con MongoDB.');

    // 1. Carga idempotente de usuarios demo
    console.log('\n👤 [1/2] Procesando usuarios demo...');
    for (const userData of demoUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.findOneAndUpdate(
        { email: userData.email.toLowerCase() },
        {
          $set: {
            name: userData.name,
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            role: userData.role
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      console.log(`   ✔️ Usuario verificado/actualizado: ${userData.email} (${userData.role})`);
    }

    // 2. Carga idempotente del catálogo de libros
    console.log('\n📚 [2/2] Procesando catálogo inicial de libros electrónicos...');
    for (const bookData of initialBooks) {
      await Book.findOneAndUpdate(
        { title: bookData.title },
        {
          $set: {
            title: bookData.title,
            author: bookData.author,
            category: bookData.category,
            description: bookData.description,
            price: bookData.price,
            stock: bookData.stock,
            coverImage: bookData.coverImage,
            digitalFile: bookData.digitalFile,
            availability: bookData.stock > 0
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      const statusLabel = bookData.stock > 0 ? `Stock: ${bookData.stock}` : 'AGOTADO (Stock: 0)';
      console.log(`   📖 Libro verificado/actualizado: "${bookData.title}" | ${bookData.category} | ${statusLabel}`);
    }

    // 3. Conteo y resumen de la base de datos
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();

    console.log('\n======================================================');
    console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
    console.log(`👥 Total de usuarios en base de datos: ${totalUsers}`);
    console.log(`📚 Total de libros en catálogo: ${totalBooks}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error durante la ejecución del seed:', error.message || error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedDatabase();
