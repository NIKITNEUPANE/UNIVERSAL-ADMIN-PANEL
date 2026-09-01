/**
 * UNIVERSAL CURRENCY SERVICE & REGISTRY
 */

export interface CurrencyConfig {
  code: string; // e.g. 'NPR', 'USD', 'EUR', 'INR'
  name: string; // e.g. 'Nepali Rupee'
  symbol: string; // e.g. 'Rs.', '$', '€', '₹'
  symbol_position: 'before' | 'after';
  decimal_places: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'NPR',
    name: 'Nepali Rupee',
    symbol: 'Rs. ',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    symbol_position: 'before',
    decimal_places: 2,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbol_position: 'before',
    decimal_places: 0,
  },
];

let activeCurrencyCode = 'NPR'; // Default to Nepali Rupee

export class CurrencyService {
  /**
   * Get list of all supported currencies
   */
  static getSupportedCurrencies(): CurrencyConfig[] {
    return SUPPORTED_CURRENCIES;
  }

  /**
   * Get active store currency configuration
   */
  static getActiveCurrency(): CurrencyConfig {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === activeCurrencyCode);
    return found || SUPPORTED_CURRENCIES[0];
  }

  /**
   * Set active store currency
   */
  static setActiveCurrency(code: string): CurrencyConfig {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === code.toUpperCase());
    if (found) {
      activeCurrencyCode = found.code;
      if (typeof window !== 'undefined') {
        localStorage.setItem('universal_store_currency', found.code);
        window.dispatchEvent(new Event('currency_change'));
      }
      return found;
    }
    return this.getActiveCurrency();
  }

  /**
   * Format any numeric amount with active currency symbol and decimal formatting
   */
  static format(amount: number, currencyCode?: string): string {
    const config = currencyCode
      ? SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || this.getActiveCurrency()
      : this.getActiveCurrency();

    const formattedNum = Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: config.decimal_places,
      maximumFractionDigits: config.decimal_places,
    });

    return config.symbol_position === 'before'
      ? `${config.symbol}${formattedNum}`
      : `${formattedNum} ${config.symbol}`;
  }

  /**
   * Format a product's price, correctly taking into account all variant prices
   */
  static formatProductPrice(
    product: { base_price: number; variants?: Array<{ price: number }> },
    currencyCode?: string
  ): string {
    const validVariants = (product.variants || []).filter(
      (v) => typeof v.price === 'number' && !isNaN(v.price)
    );

    if (validVariants.length > 0) {
      const prices = validVariants.map((v) => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice !== maxPrice) {
        return `${this.format(minPrice, currencyCode)} – ${this.format(maxPrice, currencyCode)}`;
      }
      return this.format(minPrice, currencyCode);
    }

    return this.format(product.base_price || 0, currencyCode);
  }

  /**
   * Initialize from localStorage in browser
   */
  static initClient() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('universal_store_currency');
      if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
        activeCurrencyCode = saved;
      }
    }
  }
}
