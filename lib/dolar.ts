interface IDolar {
    venta: number
    compra: number
}

let dolar: IDolar;

export async function getDolar() {
    if (dolar) return dolar;
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    const data = await res.json();
    dolar = {
        venta: data.venta,
        compra: data.compra
    }
    return dolar;
}