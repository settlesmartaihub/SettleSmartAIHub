// File name: src/common/utils/__tests__/encryption.util.spec.ts

import { EncryptionUtil } from '../encryption.util';

describe('EncryptionUtil', () => {
    describe('hashPassword', () => {
        it('should hash password', async () => {
            const password = 'testPassword123';
            const hash = await EncryptionUtil.hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50);
        });
    });

    describe('comparePassword', () => {
        it('should compare password correctly', async () => {
            const password = 'testPassword123';
            const hash = await EncryptionUtil.hashPassword(password);

            const isValid = await EncryptionUtil.comparePassword(password, hash);
            const isInvalid = await EncryptionUtil.comparePassword('wrongPassword', hash);

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });
    });

    describe('generateRandomToken', () => {
        it('should generate random token', () => {
            const token = EncryptionUtil.generateRandomToken();
            expect(token).toBeDefined();
            expect(token.length).toBe(64); // 32 bytes = 64 hex chars
        });

        it('should generate token with custom length', () => {
            const token = EncryptionUtil.generateRandomToken(16);
            expect(token.length).toBe(32); // 16 bytes = 32 hex chars
        });
    });

    describe('generateOTP', () => {
        it('should generate 6-digit OTP by default', () => {
            const otp = EncryptionUtil.generateOTP();
            expect(otp).toMatch(/^\d{6}$/);
        });

        it('should generate OTP with custom length', () => {
            const otp = EncryptionUtil.generateOTP(4);
            expect(otp).toMatch(/^\d{4}$/);
        });
    });
});