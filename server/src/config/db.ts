import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || '';
    if (!mongoUri) {
      console.warn('[MongoDB] Advertencia: MONGO_URI no está definida en las variables de entorno.');
    }
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`[MongoDB] Error al conectar a la base de datos: ${error.message}`);
    console.warn(`[MongoDB] Consejo: Asegúrate de tener una URI válida de MongoDB Atlas configurada.`);
  }
};

export default connectDB;
