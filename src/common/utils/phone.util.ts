// File name: src/common/utils/phone.util.ts

export class PhoneUtil {
    static normalizeNigerianPhone(phone: string): string {
        if (!phone) return '';

        // Remove all non-digit characters
        let normalized = phone.replace(/\D/g, '');

        // Handle different formats
        if (normalized.startsWith('234')) {
            return `+${normalized}`;
        } else if (normalized.startsWith('0')) {
            return `+234${normalized.substring(1)}`;
        } else if (normalized.length === 10) {
            return `+234${normalized}`;
        }

        return phone; // Return original if can't normalize
    }

    static isValidNigerianPhone(phone: string): boolean {
        const phoneRegex = /^(\+234|234)[789][01]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    static formatForDisplay(phone: string): string {
        const normalized = this.normalizeNigerianPhone(phone);
        // Format as +234 XXX XXX XXXX
        return normalized.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
}


export function normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Handle different Nigerian phone number formats
    if (cleaned.startsWith('234')) {
        // Already in international format without +
        return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
        // Local format starting with 0 (e.g., 08123456789)
        return '+234' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
        // 10-digit format without leading 0 (e.g., 8123456789)
        return '+234' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        // 11-digit format with leading 0 (e.g., 08123456789)
        return '+234' + cleaned.substring(1);
    }

    // If already starts with +234, return as is
    if (phone.startsWith('+234')) {
        return phone;
    }

    // Default: assume it's a 10-digit Nigerian number
    return '+234' + cleaned;
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
    const normalized = normalizePhoneNumber(phone);

    // Nigerian phone number pattern: +234 followed by 10 digits
    // Valid prefixes after +234: 70X, 80X, 81X, 90X, 91X (mobile networks)
    const nigerianPattern = /^\+234[789][01]\d{8}$/;

    return nigerianPattern.test(normalized);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
    const normalized = normalizePhoneNumber(phone);

    if (normalized.startsWith('+234')) {
        // Format as: +234 XXX XXX XXXX
        const number = normalized.substring(4); // Remove +234
        return `+234 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }

    return phone; // Return original if not Nigerian format
}

/**
 * Extract WhatsApp format from phone number
 */
export function toWhatsAppFormat(phone: string): string {
    const normalized = normalizePhoneNumber(phone);
    return 'whatsapp:' + normalized;
}

/**
 * Extract phone number from WhatsApp format
 */
export function fromWhatsAppFormat(whatsappNumber: string): string {
    if (whatsappNumber.startsWith('whatsapp:')) {
        return whatsappNumber.replace('whatsapp:', '');
    }
    return whatsappNumber;
}

/**
 * Get Nigerian network provider from phone number
 */
export function getNetworkProvider(phone: string): string {
    const normalized = normalizePhoneNumber(phone);

    if (!normalized.startsWith('+234')) {
        return 'Unknown';
    }

    const prefix = normalized.substring(4, 7); // Get first 3 digits after +234

    // Nigerian network prefixes
    const networks: { [key: string]: string } = {
        '803': 'MTN', '806': 'MTN', '810': 'MTN', '813': 'MTN', '814': 'MTN', '816': 'MTN',
        '805': 'Glo', '807': 'Glo', '811': 'Glo', '815': 'Glo',
        '802': 'Airtel', '808': 'Airtel', '812': 'Airtel', '901': 'Airtel', '902': 'Airtel', '904': 'Airtel', '907': 'Airtel',
        '809': '9Mobile', '817': '9Mobile', '818': '9Mobile', '908': '9Mobile', '909': '9Mobile'
    };

    return networks[prefix] || 'Other';
}

export const formatNigerianPhone = normalizePhoneNumber;