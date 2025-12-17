import { ShopHeader } from "@/components/layout/whatsapp-header"
import { FloatingCartButton } from "@/components/products/floating-cart-button"
import { Suspense } from "react"
import { HomeProductCatalog } from "@/components/products/home-product-catalog"

export default async function HomePage() {

  const url = process.env.NEXTAUTH_URL ?? ''
  let items;
  let catObjects;

  try {
    const [resItems, resCatObjects] = await Promise.all([
      fetch(`${url}/api/products`, { next: { revalidate: 60 } }),
      fetch(`${url}/api/categories`, { next: { revalidate: 60 } })
    ]);
    if (resItems.ok && resCatObjects.ok) {
      const dataItems = await resItems.json();
      const dataCatObjects = await resCatObjects.json();

      items = dataItems;
      catObjects = dataCatObjects.categories;

    } else {
      items = [];
      catObjects = [];
    }

  } catch (e) {
    console.error("SSR error on HomePage:", e)
  }


  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full" />
          </div>
        }
      >
        <ShopHeader />
        <main>
          <HomeProductCatalog dataInitial={items} initialCatObjects={catObjects} />
        </main>
        <FloatingCartButton />
      </Suspense>
    </div>
  )

}
