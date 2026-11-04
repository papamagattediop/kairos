// Limiteur en mémoire : protège les crédits Meta pendant le hackathon.
// ponytail: état par processus, à remplacer par un stockage partagé si plusieurs instances.
export function createLimiter(perKeyPerWindow: number, windowMs: number, globalPerDay: number) {
  const hits = new Map<string, number[]>();
  let dayStart = Date.now();
  let dayCount = 0;

  return function allow(key: string, now = Date.now()): boolean {
    if (now - dayStart >= 86_400_000) {
      dayStart = now;
      dayCount = 0;
    }
    if (dayCount >= globalPerDay) return false;

    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= perKeyPerWindow) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    dayCount += 1;
    return true;
  };
}
