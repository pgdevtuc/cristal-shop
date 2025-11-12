import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import Token from "@/lib/models/token";
import { decode } from "jsonwebtoken";
import connectDB from "@/lib/database";

// Función helper para obtener fecha en hora de Argentina (UTC-3)
function getArgentinaDate() {
  const now = new Date();

  // Calcular la hora de Argentina (UTC-3)
  const argentinaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  // Convertir a formato ISO sin la Z
  const isoString = argentinaTime.toISOString().slice(0, -1);

  // Agregar el offset -03:00
  return isoString + "-03:00";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    // 1. Verificar y obtener token válido
    let tokenDoc = await Token.findOne();
    let tok = tokenDoc?.token || '';
    let deco = tok ? decode(tok) : null;

    const isTokenExpired = !deco || (typeof deco === 'object' && deco.exp && deco.exp * 1000 < Date.now());

    if (isTokenExpired) {
      console.log('Token expirado o inválido, obteniendo nuevo token...');
      const newToken = await getTokenViumi();

      if (tokenDoc) {
        await Token.updateOne(
          { _id: tokenDoc._id },
          {
            token: newToken,
            date: getArgentinaDate()
          }
        );
      } else {
        await Token.create({
          token: newToken,
          date: getArgentinaDate()
        });
      }

      tok = newToken;
    }


    // 2. Obtener y validar los productos del request
    const data = await req.json();
    const products = data.products;
    const customerName = data.customerName;
    const customerAddress = data.customerAddress;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return Response.json(
        { error: 'No se proporcionaron productos' },
        { status: 400 }
      );
    }

    // 3. Verificar stock de cada producto
    const stockErrors = [];
    const validatedProducts = [];
    const orderItems = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        stockErrors.push({
          productId: item.productId,
          error: 'Producto no encontrado'
        });
        continue;
      }

      const requestedQuantity = item.quantity || 1;

      if (product.stock < requestedQuantity) {
        stockErrors.push({
          productId: product._id,
          name: product.name,
          available: product.stock,
          requested: requestedQuantity,
          error: 'Stock insuficiente'
        });
      } else {
        const unitPrice = product.salePrice > 0 ? product.salePrice : product.price;

        validatedProducts.push({
          id: product._id.toString(),
          name: product.name.trim(),
          quantity: requestedQuantity,
          unitPrice: {
            currency: "032",
            amount: Math.round(unitPrice * 100)
          }
        });

        orderItems.push({
          productId: product._id.toString(),
          name: product.name,
          price: unitPrice,
          quantity: requestedQuantity,
          image: product.image || item.image
        });
      }
    }

    if (stockErrors.length > 0) {
      return Response.json(
        {
          error: 'Problemas de stock en algunos productos',
          details: stockErrors
        },
        { status: 400 }
      );
    }
    // 4. Crear la orden con fecha de Argentina
    const argentinaDate = getArgentinaDate();
    console.log('Fecha Argentina para la orden:', argentinaDate);
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(5, '0')}`;

    const newOrder = await Order.create({
      orderNumber,
      customerName,
      customerAddress,
      items: orderItems,
      totalAmount: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: "PENDING",
      createdAt: argentinaDate,
      updatedAt: argentinaDate
    });


    // 5. Construir el payload para Viumi
    const checkoutPayload = {
      data: {
        attributes: {
          accountName: customerName.trim(),
          currency: "032",
          items: validatedProducts,
          redirect_urls: {
            success: `${process.env.NEXTAUTH_URL}/success?orderId=${newOrder._id}`,
            failed: `${process.env.NEXTAUTH_URL}/failed?orderId=${newOrder._id}`
          },
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhook`,
          external_reference: newOrder._id.toString()
        }
      }
    };

    const payloadString = JSON.stringify(checkoutPayload);

    const headers = {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${tok}`
    };

    const checkoutResponse = await fetch('https://api.viumi.com.ar/api/v2/orders', {
      method: 'POST',
      headers: headers,
      body: payloadString
    });

    const responseText = await checkoutResponse.text();


    if (!checkoutResponse.ok) {
      let errorData;

      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }


      // Marcar la orden como fallida con fecha de Argentina
      await Order.findByIdAndUpdate(newOrder._id, {
        status: "FAILED",
        updatedAt: getArgentinaDate()
      });

      throw new Error(`Error en Viumi [${checkoutResponse.status}]: ${JSON.stringify(errorData)}`);
    }

    const checkoutData = JSON.parse(responseText);

    // 6. Actualizar la orden con los datos de Viumi
    await Order.findByIdAndUpdate(newOrder._id, {
      viumiOrderId: checkoutData.data?.attributes?.uuid,
      viumiOrderNumber: checkoutData.data?.attributes?.orderNumber,
      checkoutUrl: checkoutData.data?.attributes?.links?.checkout,
      status: "PROCESSING",
      updatedAt: getArgentinaDate()
    });

    return Response.json({
      success: true,
      checkout: checkoutData,
      orderId: newOrder._id
    });

  } catch (error) {
    console.error('Error en checkout:', error);
    return Response.json(
      {
        error: 'Error procesando el checkout',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

async function getTokenViumi() {
  const res = await fetch('https://auth.geopagos.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: "1bc5d9b0-75c7-498b-b431-4d9335e1fac3",
      client_secret: "bb39q63iy0a6bahp5vjg",
      scope: "*"
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error obteniendo token [${res.status}]: ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}