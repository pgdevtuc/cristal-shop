export interface IProduct {
    _id: string
    name: string
    description?: string
    price: number
    salePrice?: number | null
    category: string
    image: string[]
    stock: number
    colors?: string[]
    features?: string[]
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  salePrice?: number | null
  category: string
  image: string[]
  stock: number
  colors?: string[]
  features?: string[]
}
