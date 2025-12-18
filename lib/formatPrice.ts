// /lib/formatPrice.ts
export function formatPrice(value: string | number): string {
  if (!value && value !== 0) return '';
  
  const strValue = String(value);
  
  // Separar parte entera y decimal
  const parts = strValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Formatear solo la parte entera con puntos de miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Retornar con decimal si existe
  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart}`;
  }
  
  return formattedInteger;
}