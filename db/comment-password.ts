const PASSWORD_HASH_ITERATIONS = 120_000;
const PASSWORD_SALT_BYTES = 16;

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PASSWORD_HASH_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashCommentPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const hash = await derivePasswordHash(password, salt);
  return { passwordHash: encodeBase64Url(hash), passwordSalt: encodeBase64Url(salt) };
}

export async function verifyCommentPassword(password: string, passwordHash: string, passwordSalt: string) {
  const expected = decodeBase64Url(passwordHash);
  const actual = await derivePasswordHash(password, decodeBase64Url(passwordSalt));
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}
