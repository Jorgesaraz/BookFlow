import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;
  book: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'El libro es obligatorio']
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1'],
      default: 1
    }
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio'],
      unique: true // Un carrito activo por usuario
    },
    items: [cartItemSchema]
  },
  {
    timestamps: true
  }
);

export default (mongoose.models.Cart as Model<ICart>) || mongoose.model<ICart>('Cart', cartSchema);
