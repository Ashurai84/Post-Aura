import crypto from 'crypto';

/**
 * Encryption Service - Handles all data encryption/decryption and hashing
 * Uses AES-256-CBC for encryption and SHA-256 for hashing
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-please-set-32-char-minimum-length';
const KEY_BUFFER = Buffer.from(
  ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)
);

export class EncryptionService {
  /**
   * Encrypt text using AES-256-CBC
   * Returns: iv:encryptedData (both hex encoded)
   */
  static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', KEY_BUFFER, iv);
      
      let encrypted = cipher.update(text, 'utf-8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV:encrypted for decryption later
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('[ENCRYPTION] Encrypt error:', error);
      throw error;
    }
  }

  /**
   * Decrypt text using AES-256-CBC
   * Expected format: iv:encryptedData
   */
  static decrypt(encryptedText: string): string {
    try {
      const [iv, encrypted] = encryptedText.split(':');
      
      if (!iv || !encrypted) {
        throw new Error('Invalid encrypted format');
      }

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        KEY_BUFFER,
        Buffer.from(iv, 'hex')
      );
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      
      return decrypted;
    } catch (error) {
      console.error('[ENCRYPTION] Decrypt error:', error);
      throw error;
    }
  }

  /**
   * Hash text using SHA-256
   * One-way hashing for passwords, verification codes, etc.
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate random token (for API keys, tokens, etc.)
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verify hash matches original text
   */
  static verifyHash(text: string, hash: string): boolean {
    return this.hash(text) === hash;
  }

  /**
   * Encrypt sensitive user object fields
   */
  static encryptUserData(userData: any): any {
    const encrypted = { ...userData };
    
    // Encrypt sensitive user fields
    if (encrypted.email) {
      encrypted._email_encrypted = this.encrypt(encrypted.email);
      encrypted.email = encrypted.email.split('@')[0] + '@***'; // Mask in logs
    }
    
    if (encrypted.phone) {
      encrypted._phone_encrypted = this.encrypt(encrypted.phone);
      encrypted.phone = '***';
    }
    
    return encrypted;
  }

  /**
   * Decrypt sensitive user object fields
   */
  static decryptUserData(userData: any): any {
    const decrypted = { ...userData };
    
    if (userData._email_encrypted) {
      decrypted.email = this.decrypt(userData._email_encrypted);
      delete decrypted._email_encrypted;
    }
    
    if (userData._phone_encrypted) {
      decrypted.phone = this.decrypt(userData._phone_encrypted);
      delete decrypted._phone_encrypted;
    }
    
    return decrypted;
  }
}

export default EncryptionService;
