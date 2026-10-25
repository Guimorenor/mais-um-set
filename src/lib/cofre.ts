// Cofre: cifra e decifra textos sensíveis (ex.: tokens do Mercado Livre) antes de ir para o banco.
// AES-256-GCM com chave derivada do AUTH_SECRET. Se o AUTH_SECRET mudar, é só reconectar.
import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function chave() {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) throw new Error("AUTH_SECRET não configurado.");
  return createHash("sha256").update(`mais-um-set:cofre:${segredo}`).digest();
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), dados].map((b) => b.toString("base64url")).join(".");
}

export function decifrar(pacote: string): string {
  const [iv, tag, dados] = pacote.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", chave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(dados), d.final()]).toString("utf8");
}
