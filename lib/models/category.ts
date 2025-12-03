import mongoose, { type Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: false,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

CategorySchema.index({ name: 1 }, { unique: true })

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema, "categories")
