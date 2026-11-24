const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del libro es obligatorio'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'El autor es obligatorio'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria']
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0
    },
    coverImage: {
      type: String,
      required: [true, 'La URL de la imagen de portada es obligatoria']
    },
    digitalFile: {
      type: String,
      required: [true, 'La URL o ruta del archivo digital es obligatoria'],
      select: false // CRÍTICO: nunca debe devolverse en las consultas públicas del catálogo
    },
    availability: {
      type: Boolean,
      default: true
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'El rating mínimo es 0'],
      max: [5, 'El rating máximo es 5']
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, 'El número de reseñas no puede ser negativo']
    }
  },
  {
    timestamps: true
  }
);

// Hook pre-save: disponibilidad calculada automáticamente según el stock
bookSchema.pre('save', function (next) {
  this.availability = this.stock > 0;
  next();
});

// Middleware para operaciones findOneAndUpdate / updateOne / updateMany
bookSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.stock !== undefined) {
      update.availability = update.stock > 0;
    } else if (update.$set && update.$set.stock !== undefined) {
      update.$set.availability = update.$set.stock > 0;
    }
  }
  next();
});

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
