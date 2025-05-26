// File name: src/common/utils/__tests__/phone.util.spec.ts

import { PhoneUtil } from '../phone.util';

describe('PhoneUtil', () => {
    describe('normalizeNigerianPhone', () => {
        it('should normalize phone starting with +234', () => {
            expect(PhoneUtil.normalizeNigerianPhone('+2348123456789')).toBe('+2348123456789');
        });

        it('should normalize phone starting with 234', () => {
            expect(PhoneUtil.normalizeNigerianPhone('2348123456789')).toBe('+2348123456789');
        });

        it('should normalize phone starting with 0', () => {
            expect(PhoneUtil.normalizeNigerianPhone('08123456789')).toBe('+2348123456789');
        });

        it('should normalize 10-digit phone', () => {
            expect(PhoneUtil.normalizeNigerianPhone('8123456789')).toBe('+2348123456789');
        });

        it('should return empty string for empty input', () => {
            expect(PhoneUtil.normalizeNigerianPhone('')).toBe('');
        });

        it('should return original for invalid format', () => {
            expect(PhoneUtil.normalizeNigerianPhone('123')).toBe('123');
        });
    });

    describe('isValidNigerianPhone', () => {
        it('should validate correct Nigerian phone numbers', () => {
            expect(PhoneUtil.isValidNigerianPhone('+2348123456789')).toBe(true);
            expect(PhoneUtil.isValidNigerianPhone('+2347123456789')).toBe(true);
            expect(PhoneUtil.isValidNigerianPhone('+2349123456789')).toBe(true);
        });

        it('should reject invalid Nigerian phone numbers', () => {
            expect(PhoneUtil.isValidNigerianPhone('+2346123456789')).toBe(false); // Invalid prefix
            expect(PhoneUtil.isValidNigerianPhone('+234812345678')).toBe(false);  // Too short
            expect(PhoneUtil.isValidNigerianPhone('+23481234567890')).toBe(false); // Too long
        });
    });

    describe('formatForDisplay', () => {
        it('should format phone for display', () => {
            expect(PhoneUtil.formatForDisplay('08123456789')).toBe('+234 812 345 6789');
        });
    });
});