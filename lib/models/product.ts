import mongoose, { type Document, Schema } from "mongoose"

export interface IProduct extends Document {
  name: string
  image: string[]
  colors?: string[]
  features?: string[]
  stock: number
  category: string
  description: string
  price: number
  salePrice: number
  currency: "ARS" | "USD"
  kibooId?: string
  variantId?: string
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "ARS",
    },
    kibooId: {
      type: String,
    },
    variantId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Índices para mejorar rendimiento
ProductSchema.index({ name: "text", category: "text" })
ProductSchema.index({ category: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ stock: 1 })

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema, "productos")
