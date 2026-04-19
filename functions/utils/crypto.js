// functions/utils/crypto.js

const ITERATIONS = 100000; // PBKDF2 iterations
const KEY_LENGTH = 64; // SHA-256 byte length (32 bytes = 256 bits, but returning 64 bytes here for strong hex)
const SALT_LENGTH = 16; // 16 bytes salt

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuffer(hex) {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Hashes a password using PBKDF2 (SHA-256)
 * @param {string} password 
 * @returns {Promise<string>} "salt:hash"
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return `${bufferToHex(salt)}:${bufferToHex(hashBuffer)}`;
}

/**
 * Verifies a password against a stored "salt:hash" string
 * @param {string} password 
 * @param {string} storedHashString 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHashString) {
  const [saltHex, hashHex] = storedHashString.split(':');
  const salt = hexToBuffer(saltHex);
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return bufferToHex(hashBuffer) === hashHex;
}
