// File name: src/common/pipes/__tests__/phone-normalization.pipe.spec.ts

import { BadRequestException } from '@nestjs/common';
import { PhoneNormalizationPipe } from '../phone-normalization.pipe';

describe('PhoneNormalizationPipe', () => {
    let pipe: PhoneNormalizationPipe;

    beforeEach(() => {
        pipe = new PhoneNormalizationPipe();
    });

    it('should normalize Nigerian phone numbers', () => {
        expect(pipe.transform('08123456789')).toBe('+2348123456789');
        expect(pipe.transform('2348123456789')).toBe('+2348123456789');
        expect(pipe.transform('8123456789')).toBe('+2348123456789');
    });

    it('should handle already normalized numbers', () => {
        expect(pipe.transform('+2348123456789')).toBe('+2348123456789');
    });

    it('should return empty value as is', () => {
        expect(pipe.transform('')).toBe('');
        expect(pipe.transform(null as any)).toBe(null);
    });

    it('should throw error for invalid format', () => {
        expect(() => pipe.transform('123')).toThrow(BadRequestException);
    });
});