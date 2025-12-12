export interface IOrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface IOrder {
  _id: string
  orderNumber: string
  customerName: string
  customerAddress?: string
  customerPostalCode?: string
  customerPhone: string
  shipping?:boolean
  items: IOrderItem[]
  totalAmount: number
  status: "CREATED" | "PAYMENT_FAILED" | "PAID" | "PREPARING" | "READY" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  paymentId?: string
  authorizationCode?: string
  refNumber?: string
  paymentStatus?: string
  card?: {
    bank_name: string
    issuer_name: string
    bin: string
    last_digits: string
    card_type: string
  }
  checkoutUrl?: string
  createdAt: Date
  updatedAt: Date
}
