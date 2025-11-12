import mongoose, { type Document, Schema } from "mongoose"

export interface IToken extends Document {
  token: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

const TokenSchema = new Schema<IToken>(
  {
    token: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Token || mongoose.model<IToken>("Token", TokenSchema, "tokens")