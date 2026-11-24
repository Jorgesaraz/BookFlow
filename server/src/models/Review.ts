import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio']
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'El libro es obligatorio']
    },
    rating: {
      type: Number,
      required: [true, 'La calificación es obligatoria'],
      min: [1, 'La calificación mínima es 1'],
      max: [5, 'La calificación máxima es 5']
    },
    comment: {
      type: String,
      required: [true, 'El comentario es obligatorio'],
      trim: true,
      maxlength: [1000, 'El comentario no puede exceder los 1000 caracteres']
    },
    verifiedPurchase: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Índice compuesto único para que cada usuario deje máximo una reseña por e-book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

export default (mongoose.models.Review as Model<IReview>) || mongoose.model<IReview>('Review', reviewSchema);
