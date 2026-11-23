import mongoose, { Document, Model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  coverImage: string;
  digitalFile: string;
  availability: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new mongoose.Schema<IBook>(
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
    }
  },
  {
    timestamps: true
  }
);

// Hook pre-save: disponibilidad calculada automáticamente según el stock
bookSchema.pre<IBook>('save', function (next) {
  this.availability = this.stock > 0;
  next();
});

// Middleware para operaciones findOneAndUpdate / updateOne / updateMany
bookSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'] as any, function (this: any, next) {
  const update: any = this.getUpdate();
  if (update) {
    if (update.stock !== undefined) {
      update.availability = update.stock > 0;
    } else if (update.$set && update.$set.stock !== undefined) {
      update.$set.availability = update.$set.stock > 0;
    }
  }
  next();
});

export default (mongoose.models.Book as Model<IBook>) || mongoose.model<IBook>('Book', bookSchema);
