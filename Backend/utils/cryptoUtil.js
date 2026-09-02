const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const DEFAULT_DEV_KEY = "digitalness_crm_v2_secure_encryption_key_2026";

/**
 * Validates the encryption configuration at startup.
 * Throws a fatal error if missing or using insecure defaults in production.
 */
function validateEncryptionConfiguration() {
  const isProduction = process.env.NODE_ENV === "production";
  const rawKey = process.env.ENCRYPTION_KEY;

  if (!rawKey || rawKey.trim().length === 0) {
    if (isProduction) {
      throw new Error(
        "FATAL: ENCRYPTION_KEY environment variable is missing in production. Server startup aborted for security."
      );
    } else {
      console.warn(
        "⚠️ [SECURITY WARNING] ENCRYPTION_KEY is missing in .env. Using temporary development key. Set a secure ENCRYPTION_KEY in .env."
      );
    }
  } else if (rawKey === DEFAULT_DEV_KEY && isProduction) {
    throw new Error(
      "FATAL: Default development ENCRYPTION_KEY cannot be used in production. Provide a cryptographically secure 256-bit key."
    );
  } else {
    console.log("🔒 Credential encryption configuration: VALID (AES-256-GCM)");
  }

  return true;
}

/**
 * Derives a 32-byte key from environment or development fallback
 */
function getSecretKey() {
  const rawKey = process.env.ENCRYPTION_KEY || DEFAULT_DEV_KEY;
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypts a plain string (e.g. OAuth access token) using AES-256-GCM.
 * Format: enc:gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 * Prevents double-encryption if text already starts with "enc:".
 */
exports.encryptToken = (plainText) => {
  if (!plainText) return plainText;
  if (typeof plainText !== "string") return plainText;
  if (plainText.startsWith("enc:")) return plainText; // Double-encryption protection

  const key = getSecretKey();
  const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `enc:gcm:${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an encrypted token string formatted as enc:gcm:iv:authTag:ciphertext
 */
exports.decryptToken = (cipherText) => {
  if (!cipherText || typeof cipherText !== "string" || !cipherText.startsWith("enc:")) {
    return cipherText;
  }

  const key = getSecretKey();

  try {
    const parts = cipherText.split(":");

    // AES-256-GCM Format: enc:gcm:<iv>:<authTag>:<ciphertext>
    if (parts[1] === "gcm" && parts.length === 5) {
      const iv = Buffer.from(parts[2], "hex");
      const authTag = Buffer.from(parts[3], "hex");
      const encryptedText = parts[4];

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    // Fallback for legacy enc:<iv>:<ciphertext>
    if (parts.length === 3) {
      const iv = Buffer.from(parts[1], "hex");
      const encryptedText = parts[2];
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    throw new Error("Invalid encrypted token format.");
  } catch (err) {
    throw new Error(`Token decryption failed: ${err.message}`);
  }
};

exports.validateEncryptionConfiguration = validateEncryptionConfiguration;
