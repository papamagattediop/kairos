// Lecture minimale d'un fichier .npy (version 1.x) et surface d'un pixel : partagés par le script
// de mesure et ses tests.

export function parseNpy(buf) {
  if (buf.toString("latin1", 1, 6) !== "NUMPY") throw new Error("réponse non-NPY");
  const headerLen = buf.readUInt16LE(8);
  const header = buf.toString("latin1", 10, 10 + headerLen);
  const descr = /'descr':\s*'([^']+)'/.exec(header)?.[1];
  const fortran = /'fortran_order':\s*(True|False)/.exec(header)?.[1];
  const shape = /'shape':\s*\(([^)]*)\)/.exec(header)?.[1].split(",").map((s) => s.trim()).filter(Boolean).map(Number);
  if (fortran !== "False") throw new Error("ordre Fortran non géré");
  if (!shape || shape.some((n) => !Number.isInteger(n))) throw new Error("forme NPY illisible");
  const start = 10 + headerLen;
  const count = shape.reduce((a, b) => a * b, 1);
  const sizes = { "<f8": 8, "<f4": 4, "|u1": 1, "<u2": 2 };
  const read = {
    "<f8": (i) => buf.readDoubleLE(start + i * 8),
    "<f4": (i) => buf.readFloatLE(start + i * 4),
    "|u1": (i) => buf[start + i],
    "<u2": (i) => buf.readUInt16LE(start + i * 2),
  }[descr];
  if (!read) throw new Error(`type NPY non géré : ${descr}`);
  if (buf.length < start + count * sizes[descr]) throw new Error("données NPY tronquées");
  return { shape, get: read, count };
}

// Surface d'un pixel (km²) pour une boîte lon/lat de w x h pixels, projection équirectangulaire locale.
export function zoneGeometry(bbox, w, h) {
  const midLat = (bbox[1] + bbox[3]) / 2;
  const widthKm = (bbox[2] - bbox[0]) * 111.32 * Math.cos((midLat * Math.PI) / 180);
  const heightKm = (bbox[3] - bbox[1]) * 110.57;
  return { widthKm, heightKm, zoneKm2: widthKm * heightKm, pixelKm2: (widthKm / w) * (heightKm / h) };
}

// Classes SCL (Sen2Cor) à exclure de la mesure d'eau : ombre de nuage, nuages moyens et hauts, cirrus.
export const SCL_CLOUD_OR_SHADOW = new Set([3, 8, 9, 10]);
export const SCL_WATER = 6;
