import ProductClient from "./ProductClient";
import { notFound } from "next/navigation";
import { Product } from "@/lib/types";

const BASE_URL = process.env.NEXTAUTH_URL; //

export default async function Page({ params, }: { params: { id: string } }) {

  const {id} = await params;

  if (!id) return notFound();

  const resProduct = await fetch(`${BASE_URL}/api/products/verify?productId=${id}`)

  if (!resProduct.ok) return notFound();

  const dataProduct = await resProduct.json();
  const product: Product = dataProduct.product;


  const resRelatedProduct = await fetch(`${BASE_URL}/api/products?limit=8&category=${encodeURIComponent(product.category)}&id=${id}`)
  const dataRelatedProduct = await resRelatedProduct.json();

  const relatedProducts = dataRelatedProduct.items


  return (
    <ProductClient product={product} relatedProducts={relatedProducts} />
  );
}
