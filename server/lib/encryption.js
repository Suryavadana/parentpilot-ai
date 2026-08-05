import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_HEX_LENGTH = 64;

let cachedKey = null;

const getEncryptionKey = () => {
  if (cachedKey) {
    return cachedKey;
  }

  const hexKey = process.env.DOCUMENT_ENCRYPTION_KEY;

  if (!hexKey) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY must be set (a 64-character hex string). Generate one with `node scripts/generate-encryption-key.js`.');
  }

  if (!/^[0-9a-fA-F]+$/.test(hexKey) || hexKey.length !== KEY_HEX_LENGTH) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate one with `node scripts/generate-encryption-key.js`.');
  }

  cachedKey = Buffer.from(hexKey, 'hex');
  return cachedKey;
};

const encryptBuffer = (buffer) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

const decryptBuffer = (encryptedBuffer, ivHex, authTagHex) => {
  const key = getEncryptionKey();

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  } catch (error) {
    throw new Error('Failed to decrypt document: authentication failed (wrong key, invalid iv/authTag, or tampered data)');
  }
};

export { encryptBuffer, decryptBuffer };
