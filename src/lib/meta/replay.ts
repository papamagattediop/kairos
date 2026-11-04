import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Rejeu de démonstration : META_RECORD=1 enregistre chaque réponse Meta,
// META_REPLAY=1 relit l'enregistrement et n'appelle jamais l'API.
// À réserver au local : en public, META_RECORD écrirait le texte des visiteurs sur disque.
// La clé n'entre pas dans la requête hachée ni dans le fichier enregistré.
const dir = () => process.env.META_REPLAY_DIR ?? join(process.cwd(), "data", "replay");

export const replayMode = () => process.env.META_REPLAY === "1";
export const recordMode = () => process.env.META_RECORD === "1";

function fileFor(body: string) {
  return join(dir(), `${createHash("sha256").update(body).digest("hex").slice(0, 24)}.json`);
}

// Un fichier absent ou corrompu se comporte comme « rien d'enregistré ».
export function readReplay<T>(body: string): T | null {
  const file = fileFor(body);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

// Écriture atomique : un processus interrompu ne laisse pas un fichier à moitié écrit.
export function writeReplay(body: string, reply: unknown) {
  mkdirSync(dir(), { recursive: true });
  const file = fileFor(body);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(reply, null, 2));
  renameSync(tmp, file);
}
