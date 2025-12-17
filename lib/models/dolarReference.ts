import mongoose, { Schema, type Document } from "mongoose"

export interface IDolarReference extends Document {
  price: number
  createdAt: Date
  updatedAt: Date
}

const DolarReferenceSchema = new Schema<IDolarReference>(
  {
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.DolarReference ||
  mongoose.model<IDolarReference>("DolarReference", DolarReferenceSchema, "dolar_reference")
