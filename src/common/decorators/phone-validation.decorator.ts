// File name: src/common/decorators/phone-validation.decorator.ts

import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsNigerianPhone(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isNigerianPhone',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    // Nigerian phone number validation
                    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
                    return typeof value === 'string' && phoneRegex.test(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Phone number must be a valid Nigerian phone number';
                },
            },
        });
    };
}