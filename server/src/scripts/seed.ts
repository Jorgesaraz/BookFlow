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

interface SeedUserData {
  name: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'ADMIN';
}

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

const seedDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bookflow';

  try {
    console.log(`🔄 Conectando a MongoDB (${mongoUri})...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Conexión establecida exitosamente con MongoDB.');

    for (const userData of demoUsers) {
      console.log(`⏳ Procesando usuario: ${userData.email} (${userData.role})...`);

      // Cifrar la contraseña con bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Crear o actualizar usando findOneAndUpdate con upsert: true para no duplicar registros
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

      console.log(`✅ Usuario ${userData.email} guardado/actualizado correctamente.`);
    }

    console.log('🎉 Seed completado exitosamente: Usuarios demo creados o actualizados.');
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
