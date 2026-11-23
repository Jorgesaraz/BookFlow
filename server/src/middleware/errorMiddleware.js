const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err.stack || err.message);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Error interno del servidor';

  // Manejo de error de validación de Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Manejo de clave duplicada en MongoDB
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `El valor para el campo '${field}' ya existe.`;
  }

  // Manejo de CastError de ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Recurso no encontrado con id: ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
