import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  recipientName: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'CLIENT' | 'ADMIN';
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const addressSchema = new mongoose.Schema<IAddress>({
  recipientName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo electrónico válido']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false
    },
    role: {
      type: String,
      enum: ['CLIENT', 'ADMIN'],
      default: 'CLIENT'
    },
    addresses: [addressSchema]
  },
  {
    timestamps: true
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
