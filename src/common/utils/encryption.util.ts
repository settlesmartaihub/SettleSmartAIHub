// src/common/utils/encryption.util.ts - CORRECTED VERSION
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a random API key
 */
export function generateApiKey(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a random OTP (One-Time Password)
 */
export function generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }

    return otp;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(text: string, key: string): string {
    try {
        const algorithm = 'aes-256-gcm';
        const keyBuffer = crypto.scryptSync(key, 'salt', 32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decrypt(encryptedText: string, key: string): string {
    try {
        const algorithm = 'aes-256-gcm';
        const keyBuffer = crypto.scryptSync(key, 'salt', 32);

        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Simple hash function for non-sensitive data
 */
export function simpleHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        password += charset[randomIndex];
    }

    return password;
}