import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IOrderItem {
  _id?: Types.ObjectId;
  book: Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paypalOrderId: string;
  paypalCaptureId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'El libro es obligatorio']
    },
    title: {
      type: String,
      required: [true, 'El título del libro es obligatorio']
    },
    price: {
      type: Number,
      required: [true, 'El precio del libro es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1']
    }
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio']
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Los ítems del pedido son obligatorios'],
      validate: [(val: any[]) => val.length > 0, 'La orden debe contener al menos un libro']
    },
    totalAmount: {
      type: Number,
      required: [true, 'El monto total es obligatorio'],
      min: [0, 'El monto total no puede ser negativo']
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    paypalOrderId: {
      type: String,
      required: [true, 'El paypalOrderId es obligatorio'],
      unique: true
    },
    paypalCaptureId: {
      type: String
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', orderSchema);
