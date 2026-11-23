const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Error al conectar a la base de datos: ${error.message}`);
    console.warn(`[MongoDB] Consejo: Asegúrate de tener MongoDB ejecutándose localmente o configura una URI válida de MongoDB Atlas en server/.env`);
  }
};

module.exports = connectDB;
