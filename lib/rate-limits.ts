
const RATE_LIMIT =10; 
const WINDOW_MS = 60 * 1000; // 1 minuto

// Map para almacenar IP => array de timestamps
const ipRequests = new Map<string, number[]>();

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Crea un registro si no existe
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }

  const timestamps = ipRequests.get(ip)!;

  // Filtrar timestamps fuera de la ventana
  const recentRequests = timestamps.filter(ts => ts > windowStart);
  recentRequests.push(now);

  ipRequests.set(ip, recentRequests);

  // si supera el límite → bloquear
  return recentRequests.length > RATE_LIMIT;
}
