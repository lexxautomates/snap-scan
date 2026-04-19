// API key generation + verification.
// Raw keys look like:   ss_live_<24-char-random>
// We store only the SHA-256 hash of the raw key.
import { createHash, randomBytes } from "node:crypto";

export function generateKey({ livemode = true } = {}) {
  const prefix = livemode ? "ss_live_" : "ss_test_";
  const raw = prefix + randomBytes(18).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash, prefix: raw.slice(0, 16) };
}

export function hashKey(raw) {
  return createHash("sha256").update(raw).digest("hex");
}
