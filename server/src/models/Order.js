const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  coverImage: { type: String, required: true }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    required: true
  },
  changedAt: { type: Date, default: Date.now },
  comment: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    recipientName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    default: 'PAYPAL'
  },
  paymentResult: {
    id: String,           // PayPal Order ID
    status: String,       // COMPLETED
    update_time: String,
    email_address: String
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING_PAYMENT'
  },
  paidAt: Date,
  deliveredAt: Date,
  statusHistory: [statusHistorySchema]
}, { timestamps: true });

// Registrar cambio de estado en el historial antes de guardar si cambió
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      comment: `Transición automática a ${this.status}`
    });
    if (this.status === 'PAID' && !this.paidAt) {
      this.paidAt = new Date();
    }
    if (this.status === 'COMPLETED' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
