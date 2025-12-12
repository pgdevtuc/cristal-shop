import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import Token from "@/lib/models/token";
import { decode } from "jsonwebtoken";
import connectDB from "@/lib/database";

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

    /* ------------------------------
       2. Obtener datos del request
    -------------------------------- */
    const body = await req.json();
    const { products, customerName, customerAddress, customerPhone, customerEmail } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return Response.json({ error: "No se enviaron productos." }, { status: 400 });
    }

    /* ------------------------------
       3. Validar stock y calcular monto
    -------------------------------- */
    let totalAmount = 0;
    const orderItems = [];
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
      totalAmount += price * qty;

      orderItems.push({
        description:product.descripcion,
        quantity: qty,
        unit_price:price,
        image: product.image[0],
        sku: product._id,
        name: product.name,
        category_name:product.category
      });
    }

    if (stockProblems.length > 0) {
      return Response.json(
        { error: "Stock insuficiente", details: stockProblems },
        { status: 400 }
      );
    }

    /* ------------------------------
       4. Crear Orden interna
    -------------------------------- */
    const nowAR = getArgentinaDateISO();
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(5, "0")}`;

    const order = await Order.create({
      orderNumber,
      customerName,
      customerAddress,
      customerPhone,
      shipping:false,
      items: orderItems.map(o=>({name:o.name,productId:o.sku,price:o.unit_price,quantity:o.quantity,image:o.image})),
      totalAmount,
      status: "PENDING",
      createdAt: nowAR,
      updatedAt: nowAR
    });

    /* ------------------------------
       5. Crear Payment Request en MODO
    -------------------------------- */
    const payload = {
      description: `Orden ${orderNumber}`,
      amount: totalAmount,
      currency: "ARS",
      cc_code: "13CSI",
      processor_code: process.env.MODO_CLIENT_PROCESOR_CODE ?? "",
      external_intention_id: order._id.toString(),
      
      items: orderItems
    };

    console.log("Payload", payload)

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
      await Order.findByIdAndUpdate(order._id, {
        status: "FAILED",
        updatedAt: getArgentinaDateISO()
      });

      throw new Error(`Error en MODO: ${modoText}`);
    }

    const modoData = JSON.parse(modoText);

    /* ------------------------------
       6. Guardar datos de MODO en la orden
    -------------------------------- */
    await Order.findByIdAndUpdate(order._id, {
      modoIntentionId: modoData.id,
      modoQrString: modoData.qr,
      modoDeeplink: modoData.deeplink,
      checkoutUrl: modoData.deeplink,
      status: "PROCESSING",
      updatedAt: getArgentinaDateISO()
    });
    console.log("Response MODO",modoData)

    /* ------------------------------
       7. Enviar respuesta al frontend
    -------------------------------- */
    return Response.json({
      success: true,
      orderId: order._id,
      checkout: {
        intentionId: modoData.id,
        qr: modoData.qr,
        deeplink: modoData.deeplink,
        amount: totalAmount,
        orderNumber
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
