import Product from "@/lib/models/product";
import Carts from "@/lib/models/carts";
import Token from "@/lib/models/token";
import { decode } from "jsonwebtoken";
import connectDB from "@/lib/database";
import dolarReference from "@/lib/models/dolarReference";
/* ------------------------------
   Helper: fecha en hora Argentina
-------------------------------- */
function getArgentinaDateISO() {
  const now = new Date();
  const utcMinus3 = new Date(now.getTime() - 3 * 3600 * 1000);
  return utcMinus3.toISOString().replace("Z", "-03:00");
}

/* ------------------------------
   Obtener token nuevo de MODO
-------------------------------- */
async function getModoToken() {

  const response = await fetch(
    "https://merchants.playdigital.com.ar/v2/stores/companies/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cristal Shop",
      },
      body: JSON.stringify({
        username: process.env.MODO_CLIENT_USER,
        password: process.env.MODO_CLIENT_PASSWORD
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error obteniendo token de MODO: ${err}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("La API de MODO no devolvió accessToken");
  }

  return data.access_token;
}

/* ------------------------------
   POST - Crear Orden + Payment Intention
-------------------------------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    /* ------------------------------
       1. Obtener token válido
    -------------------------------- */
    let tokenDoc = await Token.findOne();
    let token = tokenDoc?.token || "";
    const decoded = token ? decode(token) : null;

    const expired =
      !decoded ||
      (typeof decoded === "object" &&
        decoded.exp &&
        decoded.exp * 1000 < Date.now());

    if (expired) {
      const newToken = await getModoToken();

      if (tokenDoc) {
        tokenDoc.token = newToken;
        tokenDoc.date = getArgentinaDateISO();
        await tokenDoc.save();
      } else {
        await Token.create({
          token: newToken,
          date: getArgentinaDateISO()
        });
      }

      token = newToken;
    }

    const dolarRef = await dolarReference.findOne().lean();
    const dolarPrice = (dolarRef as any)?.price ?? 1

    /* ------------------------------
       2. Obtener datos del request
    -------------------------------- */
    const body = await req.json();
    const { products, customerName, customerAddress, customerPostalCode, customerPhone, customerEmail, shipping } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return Response.json({ error: "No se enviaron productos." }, { status: 400 });
    }

    if (shipping) {
      if (!customerAddress || !String(customerAddress).trim()) {
        return Response.json({ error: "La dirección es requerida cuando hay envío" }, { status: 400 });
      }
      if (!customerPostalCode || !String(customerPostalCode).trim()) {
        return Response.json({ error: "El código postal es requerido cuando hay envío" }, { status: 400 });
      }
    }
    if (!customerEmail || !customerName || !customerPhone) return Response.json({ error: "Completa los campos" }, { status: 400 });

    /* ------------------------------
       3. Validar stock y calcular monto
    -------------------------------- */
    let totalAmount = 0;
    const cartItems = [];
    const stockProblems = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        stockProblems.push({ productId: item.productId, error: "Producto no encontrado" });
        continue;
      }

      const qty = item.quantity || 1;

      if (product.stock < qty) {
        stockProblems.push({
          productId: product._id,
          name: product.name,
          available: product.stock,
          requested: qty,
          error: "Stock insuficiente"
        });
        continue;
      }

      const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
      const parsedPrice = product.currency == "ARS" ? price : Math.round((price * dolarPrice + Number.EPSILON) * 100) / 100
      totalAmount += parsedPrice * qty;

      cartItems.push({
        description: product.descripcion,
        quantity: qty,
        unit_price: parsedPrice,
        image: product.image[0],
        sku: product._id,
        name: product.name,
        category_name: product.category
      });
    }

    if (stockProblems.length > 0) {
      return Response.json(
        { error: "Stock insuficiente", details: stockProblems },
        { status: 400 }
      );
    }


    const cart = await Carts.create({
      customerName,
      customerEmail,
      customerPhone,
      items: cartItems.map(o => ({ name: o.name, productId: o.sku, price: o.unit_price, quantity: o.quantity, image: o.image })),
      shipping: Boolean(shipping),
      customerAddress,
      customerPostalCode,
      totalAmount,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000)
    });

    /* ------------------------------
       5. Crear Payment Request en MODO
    -------------------------------- */
    const payload = {
      description: `Pedido a Cristal Shop`,
      amount: totalAmount,
      currency: "ARS",
      cc_code: "6CCI",
      processor_code: process.env.MODO_CLIENT_PROCESOR_CODE ?? "",
      external_intention_id: cart._id.toString(),
      items: cartItems
    };


    const modoRes = await fetch(
      "https://merchants.playdigital.com.ar/v2/payment-requests/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Cristal Shop",
        },
        body: JSON.stringify(payload)
      }
    );

    const modoText = await modoRes.text();

    if (!modoRes.ok) {
      throw new Error(`Error en MODO: ${modoText}`);
    }

    const modoData = JSON.parse(modoText);


    /* ------------------------------
       7. Enviar respuesta al frontend
    -------------------------------- */
    const callbackSuccess = encodeURIComponent(
      'https://cristaltienda.waichatt.com/success'
    );

    const callbackFailed = encodeURIComponent(
      'https://cristaltienda.waichatt.com/failed'
    );

    const deeplink = `https://www.modo.com.ar/pagar` +
      `?qr=${modoData.qr}` +
      `&callback=${callbackFailed}` +
      `&callbackSuccess=${callbackSuccess}` +
      `&paymentRequestId=${modoData.id}`;


    return Response.json({
      success: true,
      orderId: cart._id,
      checkout: {
        intentionId: modoData.id,
        deeplink,
        amount: totalAmount,
      }
    });

  } catch (err) {
    console.error("Checkout error:", err);
    return Response.json(
      {
        error: "Error procesando checkout",
        details: err instanceof Error ? err.message : err
      },
      { status: 500 }
    );
  }
}
