/**
 * Currency utility functions
 */

/**
 * Currency symbols map
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'CHF',
    'CAD': 'CA$',
    'AUD': 'A$',
    'CNY': '¥',
    'INR': '₹',
    'BRL': 'R$',
    'MXN': 'MX$',
    'ZAR': 'R',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'TRY': '₺',
    'ARS': 'AR$',
    'CLP': 'CL$',
    'COP': 'CO$',
    'PEN': 'S/',
};

/**
 * Get currency symbol from currency code
 * @param currencyCode ISO 4217 currency code (e.g., 'EUR', 'USD')
 * @returns Currency symbol (e.g., '€', '$')
 */
export function getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format amount with currency symbol
 * @param amount Amount to format
 * @param currencyCode ISO 4217 currency code
 * @param position Symbol position ('before' or 'after')
 * @returns Formatted string with amount and currency symbol
 */
export function formatCurrency(
    amount: number,
    currencyCode: string = 'EUR',
    position: 'before' | 'after' = 'after'
): string {
    const symbol = getCurrencySymbol(currencyCode);
    const formattedAmount = amount.toFixed(2);

    return position === 'before'
        ? `${symbol}${formattedAmount}`
        : `${formattedAmount}${symbol}`;
}

/**
 * Get default currency from environment
 */
export function getDefaultCurrency(): string {
    return import.meta.env.VITE_DEFAULT_CURRENCY || 'EUR';
}
