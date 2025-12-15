// Plantillas de email para Cristal Shop con Nodemailer
import nodemailer from "nodemailer"

interface IProduct {
  nombre: string
  imagen: string
  cantidad: boolean,
  precio: number
}

interface IDatos {
  email: string
  nombre: string
  numeroPedido: string
  tarjeta: string
  envio: boolean,
  direccion?: string
  codigoPostal?: string
  sucursalRetiro?: string
  productos: IProduct[]
  subtotal: number,
  descuentos?: number,
  costoEnvio?: number,
  total: number,
  codigoSeguimiento?: string // Solo para envíos
  motivoRechazo?: string // Solo para rechazos
}

// Colores de Cristal Shop (basados en la imagen)
const colors = {
  primary: '#dc2626',      // Rojo de los botones
  secondary: '#ea580c',    // Naranja
  dark: '#1f2937',         // Gris oscuro
  light: '#f3f4f6',        // Gris claro
  success: '#059669',      // Verde
  white: '#ffffff'
};

// Función para generar lista de productos
const generarListaProductos = (productos: IProduct[]) => {
  return productos.map(prod => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center;">
          <img src="${prod.imagen}" alt="${prod.nombre}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
          <div>
            <p style="margin: 0; font-weight: 600; color: ${colors.dark};">${prod.nombre}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${prod.cantidad} un.</p>
          </div>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: ${colors.dark};">
        $${prod.precio.toLocaleString()}
      </td>
    </tr>
  `).join('');
};

// 1. PLANTILLA: PAGO APROBADO
const emailPagoAprobado = (datos: IDatos) => {
  const {
    nombre,
    numeroPedido,
    tarjeta,
    envio,
    direccion,
    codigoPostal,
    sucursalRetiro,
    productos,
    subtotal,
    descuentos = 0,
    costoEnvio = 0,
    codigoSeguimiento,
    total
  } = datos;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: ${colors.primary}; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: ${colors.white}; font-size: 28px; font-weight: 700;">CRISTAL SHOP</h1>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h2 style="margin: 0; color: ${colors.success}; font-size: 24px; font-weight: 700;">¡Tu pago ha sido aprobado!</h2>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pedido<br>Realizado</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pago<br>Aprobado</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.secondary}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pedido en<br>Preparación</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.secondary}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Preparado<br>o Enviado</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>


              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700; border-bottom: 2px solid ${colors.primary}; padding-bottom: 10px;">DATOS DEL COMPRADOR</h3>

                  <div>
                    <h4 style="margin: 0 0 10px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">PAGO</h4>
                    <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${tarjeta}</p>
                    <p style="margin: 5px 0; color: ${colors.secondary}; font-size: 16px; font-weight: 700;">$ ${total.toLocaleString()}</p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700; border-bottom: 2px solid ${colors.primary}; padding-bottom: 10px;">PEDIDO</h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">#${numeroPedido}</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    ${generarListaProductos(productos)}
                    
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Productos</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: ${colors.dark};">$ ${subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Descuentos</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: ${colors.dark};">$ ${descuentos?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Costo de envío</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: ${colors.dark};">$ ${costoEnvio.toLocaleString()}</td>
                    </tr>
                    <tr style="background-color: ${colors.light};">
                      <td style="padding: 20px; text-align: right; color: ${colors.dark}; font-size: 18px; font-weight: 700;">Total</td>
                      <td style="padding: 20px; text-align: right; color: ${colors.primary}; font-size: 20px; font-weight: 700;">$ ${total.toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>


              <tr>
                <td style="padding: 30px 40px; background-color: ${colors.light}; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin: 0 0 15px 0; color: ${colors.dark}; font-size: 16px; font-weight: 700;">¿Necesitas ayuda?</h4>
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                    En caso de dudas o consultas por favor comunicarse por mensaje de texto al 
                   <strong style="color: #dc2626;">WHATSAPP (388) 505-1954</strong> de lunes a sábados de 9 a 20 hs
                  </p>
                  <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 14px;">Estamos para ayudarte!</p>
                  <p style="margin: 10px 0 0 0; color: ${colors.dark}; font-size: 14px; font-weight: 600;">Equipo Cristal Shop</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// 2. PLANTILLA: PEDIDO EN PREPARACIÓN
const emailPedidoPreparacion = (datos: IDatos) => {
  const {
    nombre,
    numeroPedido,
    tarjeta,
    envio,
    direccion,
    codigoPostal,
    sucursalRetiro,
    productos,
    subtotal,
    descuentos = 0,
    costoEnvio = 0,
    total
  } = datos;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background-color: ${colors.primary}; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: ${colors.white}; font-size: 28px; font-weight: 700;">CRISTAL SHOP</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h2 style="margin: 0; color: #2563eb; font-size: 24px; font-weight: 700;">¡Tu pago fue aprobado!</h2>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Estamos preparando tu pedido</p>
                </td>
              </tr>

               <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pedido<br>Realizado</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pago<br>Aprobado</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pedido en<br>Preparación</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.secondary}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Preparado<br>o Enviado</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 40px;">
                  <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      ¡Hola ${nombre}! Tu pago ha sido confirmado y estamos preparando tu pedido. Recibirás un nuevo email con las instrucciones para retirar o los detalles del envío muy pronto.
                    </p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700; border-bottom: 2px solid ${colors.primary}; padding-bottom: 10px;">DATOS DEL COMPRADOR</h3>
                  
                  <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">DIRECCIÓN DE ${envio ? 'ENVÍO' : 'RETIRO'}</h4>
                    ${envio ? `
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${direccion}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">CP: ${codigoPostal}</p>
                    ` : `
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px; font-weight: 600;">${sucursalRetiro}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${direccion}</p>
                    `}
                  </div>

                  <div>
                    <h4 style="margin: 0 0 10px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">PAGO</h4>
                    <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${tarjeta}</p>
                    <p style="margin: 5px 0; color: ${colors.secondary}; font-size: 16px; font-weight: 700;">$ ${total.toLocaleString()}</p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700; border-bottom: 2px solid ${colors.primary}; padding-bottom: 10px;">PEDIDO</h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">#${numeroPedido}</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    ${generarListaProductos(productos)}
                    
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Productos</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: ${colors.dark};">$ ${subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Descuentos</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: ${colors.dark};">$ ${descuentos.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Costo de envío</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: ${colors.dark};">$ ${costoEnvio.toLocaleString()}</td>
                    </tr>
                    <tr style="background-color: ${colors.light};">
                      <td style="padding: 20px; text-align: right; color: ${colors.dark}; font-size: 18px; font-weight: 700;">Total</td>
                      <td style="padding: 20px; text-align: right; color: ${colors.primary}; font-size: 20px; font-weight: 700;">$ ${total.toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px; background-color: ${colors.light}; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin: 0 0 15px 0; color: ${colors.dark}; font-size: 16px; font-weight: 700;">¿Necesitas ayuda?</h4>
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                    En caso de dudas o consultas por favor comunicarse por mensaje de texto al 
                    <strong style="color: #dc2626;">WHATSAPP (388) 505-1954</strong> de lunes a sábados de 9 a 20 hs
                  </p>
                  <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 14px;">Estamos para ayudarte!</p>
                  <p style="margin: 10px 0 0 0; color: ${colors.dark}; font-size: 14px; font-weight: 600;">Equipo Cristal Shop</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};


// 4. PLANTILLA: PAGO RECHAZADO
const emailPagoRechazado = (datos: IDatos) => {
  const {
    nombre,
    numeroPedido,
    tarjeta,
    motivoRechazo,
    productos,
    total
  } = datos;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background-color: ${colors.primary}; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: ${colors.white}; font-size: 28px; font-weight: 700;">CRISTAL SHOP</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h2 style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 700;">Hubo un problema con tu pago</h2>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">Tu pedido no pudo ser procesado</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 40px;">
                  <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                      <strong>Hola ${nombre},</strong>
                    </p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                      Lamentablemente tu pago no pudo ser procesado. ${motivoRechazo ? `Motivo: ${motivoRechazo}` : 'Por favor, verifica los datos de tu tarjeta o intenta con otro método de pago.'}
                    </p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 40px;">
                  <h3 style="margin: 0 0 15px 0; color: ${colors.dark}; font-size: 16px; font-weight: 700;">¿Qué puedes hacer?</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>Verificar que los datos de tu tarjeta sean correctos</li>
                    <li>Asegurarte de tener fondos suficientes</li>
                    <li>Contactar a tu banco para verificar si hay restricciones</li>
                    <li>Intentar con otro método de pago</li>
                  </ul>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: ${colors.dark}; font-size: 18px; font-weight: 700; border-bottom: 2px solid ${colors.primary}; padding-bottom: 10px;">DETALLES DEL PEDIDO</h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Pedido: #${numeroPedido}</p>
                  
                  <div style="background-color: ${colors.light}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">MÉTODO DE PAGO INTENTADO</h4>
                    <p style="margin: 0; color: #4b5563; font-size: 14px;">${tarjeta}</p>
                  </div>

                  <h4 style="margin: 20px 0 15px 0; color: ${colors.dark}; font-size: 14px; font-weight: 700;">PRODUCTOS</h4>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    ${generarListaProductos(productos)}
                    
                    <tr style="background-color: ${colors.light};">
                      <td style="padding: 20px; text-align: right; color: ${colors.dark}; font-size: 18px; font-weight: 700;">Total</td>
                      <td style="padding: 20px; text-align: right; color: ${colors.dark}; font-size: 20px; font-weight: 700;">$ ${total.toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 40px 40px 40px; text-align: center;">
                  <a href="https://cristaltienda.waichatt.com/" style="display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; margin-right: 10px;">Intentar nuevamente</a>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px; background-color: ${colors.light}; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin: 0 0 15px 0; color: ${colors.dark}; font-size: 16px; font-weight: 700;">¿Necesitas ayuda?</h4>
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                    Si tienes dudas sobre este rechazo o necesitas asistencia, no dudes en contactarnos por 
                    <strong style="color: #dc2626;">WHATSAPP (388) 505-1954</strong> de lunes a sábados de 9 a 20 hs
                  </p>
                  <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 14px;">Estamos para ayudarte!</p>
                  <p style="margin: 10px 0 0 0; color: ${colors.dark}; font-size: 14px; font-weight: 600;">Equipo Cristal Shop</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

type mailTemplate = 'pago_aprobado' | 'pedido_preparacion' | 'preparado_enviado' | 'pago_rechazado'

// FUNCIÓN PARA ENVIAR EMAILS CON NODEMAILER
const enviarEmail = async (tipo: mailTemplate, datosEmail: IDatos) => {
  // Configurar el transporter de nodemailer
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Seleccionar la plantilla según el tipo
  let htmlContent;
  let subject;

  switch (tipo) {
    case 'pago_aprobado':
      htmlContent = emailPagoAprobado(datosEmail);
      subject = `¡Tu pago fue aprobado! ${datosEmail.nombre}! Pedido #${datosEmail.numeroPedido}`;
      break;
    case 'pedido_preparacion':
      htmlContent = emailPedidoPreparacion(datosEmail);
      subject = `¡Tu pedido esta en preparación! Pedido #${datosEmail.numeroPedido} en preparación`;
      break;
    case 'preparado_enviado':
      htmlContent = emailPreparadoEnviado(datosEmail);
      subject = `¡Tu pedido #${datosEmail.numeroPedido} está ${datosEmail.envio ? 'en camino' : 'listo para retirar'}!`;
      break;
    case 'pago_rechazado':
      htmlContent = emailPagoRechazado(datosEmail);
      subject = `Problema con tu pago - Pedido #${datosEmail.numeroPedido}`;
      break;
    default:
      throw new Error('Tipo de email no válido');
  }

  // Configurar el email
  const mailOptions = {
    from: '"Cristal Shop" <noreply@cristalshop.com>',
    to: datosEmail.email,
    subject: subject,
    html: htmlContent
  };

  // Enviar el email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};


// 3. PLANTILLA: PREPARADO O ENVIADO
const emailPreparadoEnviado = (datos: any) => {
  const {
    nombre,
    numeroPedido,
    tarjeta,
    envio,
    direccion,
    codigoPostal,
    sucursalRetiro,
    productos,
    subtotal,
    descuentos = 0,
    costoEnvio = 0,
    total,
    codigoSeguimiento // Opcional para envíos
  } = datos;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">CRISTAL SHOP</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h2 style="margin: 0; color: #059669; font-size: 24px; font-weight: 700;">¡Tu pedido está ${envio ? 'en camino' : 'listo para retirar'}!</h2>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">${envio ? 'Tu paquete ha sido enviado' : 'Ya puedes retirar tu pedido'}</p>
                </td>
              </tr>

             <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pedido<br>Realizado</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pago<br>Aprobado</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Pedido en<br>Preparación</p>
                      </td>
                      <td width="25%" style="text-align: center;">
                        <div style="width: 50px; height: 50px; background-color: ${colors.success}; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: ${colors.white}; font-weight: 700;">✓</div>
                        <p style="margin: 0; font-size: 12px; color: ${colors.dark}; font-weight: 600;">Preparado<br>o Enviado</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 40px;">
                  <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                      ${envio ?
      `¡Hola ${nombre}! Tu pedido ha sido enviado. ${codigoSeguimiento ? `Puedes rastrear tu envío con el código: <strong>${codigoSeguimiento}</strong>` : 'Recibirás tu paquete en los próximos días.'}`
      :
      `¡Hola ${nombre}! Tu pedido está listo para retirar en <strong>${sucursalRetiro}</strong>. Recuerda llevar tu tarjeta y el número de pedido.`
    }
                    </p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 700; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">DATOS DEL COMPRADOR</h3>
                  
                  <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 700;">DIRECCIÓN DE ${envio ? 'ENVÍO' : 'RETIRO'}</h4>
                    ${envio ? `
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${direccion}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">CP: ${codigoPostal}</p>
                    ` : `
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px; font-weight: 600;">${sucursalRetiro}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${direccion}</p>
                      <p style="margin: 10px 0 0 0; color: #dc2626; font-size: 13px; font-weight: 600;">⚠️ Recuerda llevar tu tarjeta al retirar</p>
                    `}
                  </div>

                  <div>
                    <h4 style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 700;">PAGO</h4>
                    <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">${tarjeta}</p>
                    <p style="margin: 5px 0; color: #ea580c; font-size: 16px; font-weight: 700;">$ ${total.toLocaleString()}</p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px;">
                  <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 700; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">PEDIDO</h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">#${numeroPedido}</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    ${generarListaProductos(productos)}
                    
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Productos</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: #1f2937;">$ ${subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Descuentos</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: #1f2937;">$ ${descuentos.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px; text-align: right; color: #6b7280;">Costo de envío</td>
                      <td style="padding: 15px; text-align: right; font-weight: 600; color: #1f2937;">$ ${costoEnvio.toLocaleString()}</td>
                    </tr>
                    <tr style="background-color: #f3f4f6;">
                      <td style="padding: 20px; text-align: right; color: #1f2937; font-size: 18px; font-weight: 700;">Total</td>
                      <td style="padding: 20px; text-align: right; color: #dc2626; font-size: 20px; font-weight: 700;">$ ${total.toLocaleString()}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 40px; background-color: #f3f4f6; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 700;">¿Necesitas ayuda?</h4>
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                    En caso de dudas o consultas por favor comunicarse por mensaje de texto al 
                    <strong style="color: #dc2626;">WHATSAPP (388) 505-1954</strong> de lunes a sábados de 9 a 20 hs
                  </p>
                  <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 14px;">Estamos para ayudarte!</p>
                  <p style="margin: 10px 0 0 0; color: #1f2937; font-size: 14px; font-weight: 600;">Equipo Cristal Shop</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// EJEMPLO DE USO
/*
const datosEjemplo = {
  email: 'cliente@ejemplo.com',
  nombre: 'Marcos Julian',
  numeroPedido: '1575331415016-01',
  tarjeta: 'Visa Electron terminada en 4194',
  envio: false,
  direccion: '25 de Mayo, 789',
  codigoPostal: '4000',
  sucursalRetiro: 'Sucursal Urquiza',
  productos: [
    {
      nombre: 'Leche Infantil en Polvo Nidina 1 x 800 gr',
      imagen: 'url-imagen',
      cantidad: 2,
      precio: 23154
    }
  ],
  subtotal: 46308,
  descuentos: 0,
  costoEnvio: 0,
  total: 46308,
  codigoSeguimiento: 'ABC123456789', // Solo para envíos
  motivoRechazo: 'Fondos insuficientes' // Solo para rechazos
};

// Enviar email de pago aprobado
await enviarEmail('pago_aprobado', datosEjemplo);

// Enviar email de pedido en preparación
await enviarEmail('pedido_preparacion', datosEjemplo);

// Enviar email de preparado/enviado
await enviarEmail('preparado_enviado', datosEjemplo);

// Enviar email de pago rechazado
await enviarEmail('pago_rechazado', datosEjemplo);
*/

export { enviarEmail }
