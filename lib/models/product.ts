import mongoose, { type Document, Schema } from "mongoose"

export interface IProduct extends Document {
  _id: string
  name: string
  image: string
  stock: number
  category: string
  description: string
  price: number
  salePrice: number
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
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
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
