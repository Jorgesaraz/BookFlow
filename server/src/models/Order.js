const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
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

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio']
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Los ítems del pedido son obligatorios'],
      validate: [(val) => val.length > 0, 'La orden debe contener al menos un libro']
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

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
