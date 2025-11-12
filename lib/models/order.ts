import mongoose, { type Document, Schema } from "mongoose"

export interface IOrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface IOrder extends Document {
  _id: string
  orderNumber: string
  customerName: string
  customerAddress?: string
  items: IOrderItem[]
  totalAmount: number
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED"
  viumiOrderId?: string
  viumiOrderNumber?: string
  paymentId?: number
  authorizationCode?: string
  refNumber?: string
  paymentStatus?: string
  checkoutUrl?: string
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    viumiOrderId: {
      type: String,
      index: true,
    },
    viumiOrderNumber: {
      type: String,
    },
    paymentId: {
      type: Number,
    },
    authorizationCode: {
      type: String,
    },
    refNumber: {
      type: String,
    },
    paymentStatus: {
      type: String,
    },
    checkoutUrl: {
      type: String,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    }
  },
  {
    timestamps: false, // Deshabilitamos timestamps automáticos para controlarlos manualmente
  }
)

// Índices
OrderSchema.index({ status: 1 })
OrderSchema.index({ createdAt: -1 })

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema, "orders")