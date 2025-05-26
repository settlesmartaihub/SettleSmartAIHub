// File name: src/common/pipes/phone-normalization.pipe.ts

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PhoneNormalizationPipe implements PipeTransform {
    transform(value: string): string {
        if (!value) return value;

        // Remove all non-digit characters
        let phone = value.replace(/\D/g, '');

        // Handle different Nigerian phone formats
        if (phone.startsWith('234')) {
            phone = '+' + phone;
        } else if (phone.startsWith('0')) {
            phone = '+234' + phone.substring(1);
        } else if (phone.length === 10) {
            phone = '+234' + phone;
        } else {
            throw new BadRequestException('Invalid phone number format');
        }

        return phone;
    }
}