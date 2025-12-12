import mongoose, { type Document, Schema } from "mongoose"

export interface IOrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface IOrder extends Document {
  orderNumber?: string
  customerName: string
  customerEmail: string
  customerAddress?: string
  customerPostalCode?: string
  customerPhone: string
  shipping: boolean
  items: IOrderItem[]
  totalAmount: number
  status: "CREATED" | "PAYMENT_FAILED" | "PAID" | "PREPARING" | "READY" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  paymentId?: number
  authorizationCode?: string
  refNumber: string
  paymentStatus?: "SCANNED" | "PROCESSING" | "REJECTED" | "ACCEPTED"
  checkoutUrl?: string
  stockUpdated?:boolean
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    customerPostalCode: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    shipping: {
      type: Boolean,
      required: true,
      default: false,
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
      enum: ["CREATED", "PAYMENT_FAILED", "PAID", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "CREATED",
    },
    paymentId: {
      type: Number,
    },
    authorizationCode: {
      type: String,
    },
    refNumber: {
      type: String,
      unique:true
    },
    paymentStatus: {
      type: String,
    },
    checkoutUrl: {
      type: String,
    },
    stockUpdated:{
      type:Boolean,
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
