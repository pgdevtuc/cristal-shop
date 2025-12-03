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
  customerPhone: string
  shipping?:boolean
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