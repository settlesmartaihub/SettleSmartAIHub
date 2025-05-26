import { Test, TestingModule } from '@nestjs/testing';
import { PhoneUtil } from '../utils/phone.util';
import { ResponseUtil } from '../utils/response.util';
import { EncryptionUtil } from '../utils/encryption.util';
import { PhoneNormalizationPipe } from '../pipes/phone-normalization.pipe';

describe('Common Module Integration', () => {
    let module: TestingModule;
    let phoneNormalizationPipe: PhoneNormalizationPipe;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [PhoneNormalizationPipe],
        }).compile();

        phoneNormalizationPipe = module.get<PhoneNormalizationPipe>(PhoneNormalizationPipe);
    });

    it('should integrate phone utilities with pipes', () => {
        const originalPhone = '08123456789';
        const normalizedPhone = phoneNormalizationPipe.transform(originalPhone);

        expect(PhoneUtil.isValidNigerianPhone(normalizedPhone)).toBe(true);
        expect(PhoneUtil.formatForDisplay(normalizedPhone)).toBe('+234 812 345 6789');
    });

    it('should create consistent response format', async () => {
        const testData = { phone: '+2348123456789' };
        const response = ResponseUtil.success(testData, 'Phone validated');

        expect(response.success).toBe(true);
        expect(response.data.phone).toBe(testData.phone);
    });

    it('should handle password encryption flow', async () => {
        const password = 'userPassword123';
        const hashedPassword = await EncryptionUtil.hashPassword(password);
        const isValid = await EncryptionUtil.comparePassword(password, hashedPassword);

        expect(isValid).toBe(true);

        const response = ResponseUtil.success({ passwordSet: true }, 'Password created');
        expect(response.success).toBe(true);
    });
});