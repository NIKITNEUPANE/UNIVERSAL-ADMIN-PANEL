import { CurrencyService, SUPPORTED_CURRENCIES } from '../lib/services/currency-service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

console.log('\n🧪 Starting Universal Multi-Currency & Nepali Rupee Test Suite...\n');

// 1. Default Currency Check
console.log('--- Suite 1: Default Currency (Nepali Rupee) ---');
const defaultCurr = CurrencyService.getActiveCurrency();
assert(defaultCurr.code === 'NPR', 'Default active currency is NPR (Nepali Rupee)');
assert(defaultCurr.symbol.trim() === 'Rs.', 'Default currency symbol is Rs.');

// 2. Nepali Rupee Formatting
console.log('\n--- Suite 2: Nepali Rupee Formatting ---');
const formattedNPR = CurrencyService.format(2500);
assert(formattedNPR === 'Rs. 2,500.00', `Formats 2500 as "Rs. 2,500.00", got: ${formattedNPR}`);

const formattedDecimalNPR = CurrencyService.format(1499.5);
assert(formattedDecimalNPR === 'Rs. 1,499.50', `Formats 1499.5 as "Rs. 1,499.50", got: ${formattedDecimalNPR}`);

// 3. Supported Currencies Registry
console.log('\n--- Suite 3: Global Currency Support ---');
const supported = CurrencyService.getSupportedCurrencies();
assert(supported.length >= 8, 'Supported currencies list contains at least 8 currencies');
assert(supported.some((c) => c.code === 'NPR'), 'NPR is in supported registry');
assert(supported.some((c) => c.code === 'USD'), 'USD is in supported registry');
assert(supported.some((c) => c.code === 'INR'), 'INR is in supported registry');
assert(supported.some((c) => c.code === 'EUR'), 'EUR is in supported registry');
assert(supported.some((c) => c.code === 'GBP'), 'GBP is in supported registry');

// 4. Currency Switching
console.log('\n--- Suite 4: Dynamic Currency Switching ---');
CurrencyService.setActiveCurrency('USD');
assert(CurrencyService.getActiveCurrency().code === 'USD', 'Switched to USD active currency');
const formattedUSD = CurrencyService.format(45);
assert(formattedUSD === '$45.00', `Formats 45 in USD as "$45.00", got: ${formattedUSD}`);

CurrencyService.setActiveCurrency('EUR');
assert(CurrencyService.getActiveCurrency().code === 'EUR', 'Switched to EUR active currency');
const formattedEUR = CurrencyService.format(120);
assert(formattedEUR === '€120.00', `Formats 120 in EUR as "€120.00", got: ${formattedEUR}`);

// Reset back to NPR default
CurrencyService.setActiveCurrency('NPR');
assert(CurrencyService.getActiveCurrency().code === 'NPR', 'Reset back to NPR default');

// 5. Product Price Formatting (Uniform vs Range)
console.log('\n--- Suite 5: Product Price & Variant Pricing ---');
const uniformProduct = {
  base_price: 19.5,
  variants: [{ price: 34 }, { price: 34 }, { price: 34 }],
};
const formattedUniform = CurrencyService.formatProductPrice(uniformProduct);
assert(formattedUniform === 'Rs. 34.00', `Uniform variants price (34) displays as "Rs. 34.00", got: ${formattedUniform}`);

const rangeProduct = {
  base_price: 28,
  variants: [{ price: 26 }, { price: 28 }],
};
const formattedRange = CurrencyService.formatProductPrice(rangeProduct);
assert(formattedRange === 'Rs. 26.00 – Rs. 28.00', `Range variants price (26-28) displays as "Rs. 26.00 – Rs. 28.00", got: ${formattedRange}`);

const simpleProduct = {
  base_price: 49.99,
  variants: [],
};
const formattedSimple = CurrencyService.formatProductPrice(simpleProduct);
assert(formattedSimple === 'Rs. 49.99', `Simple product price displays base_price "Rs. 49.99", got: ${formattedSimple}`);

console.log('\n========================================');
console.log('Currency Test Results: All Tests Passed!');
console.log('========================================\n');
