import mongoose, { type Document, Schema } from "mongoose"

export interface ICarts extends Document {
    customerName: string
    customerEmail: string
    customerPhone: string
    items: ICardItem[]
    shipping: boolean
    customerAddress?: string
    customerPostalCode?: string
    totalAmount: number
    expiresAt: Date
    createdAt: Date
}

export interface ICardItem {
    productId: string
    name: string
    price: number
    quantity: number
    image?: string
}


const cartsSchema = new Schema<ICarts>({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
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
    shipping: {
        type: Boolean,
        required: true,
        default: false
    },
    customerAddress: {
        type: String,
        trim: true
    },
    customerPostalCode: {
        type: String,
        trim: true
    },
    expiresAt:{
        type:Date,
        required:true
    }
},
    {
        timestamps: true
    }
)

export default mongoose.models.carts || mongoose.model<ICarts>("carts", cartsSchema)
