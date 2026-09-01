import { ProductOption, ProductVariant } from '@/lib/types/commerce';

/**
 * Generate Cartesian product combinations from an array of option definitions
 */
export function generateVariantMatrix(
  productId: string,
  productTitle: string,
  basePrice: number,
  costPrice: number = 0,
  options: ProductOption[]
): ProductVariant[] {
  const activeOptions = options.filter((opt) => opt.values && opt.values.length > 0);

  if (activeOptions.length === 0) {
    return [
      {
        id: `var-default-${Date.now()}`,
        product_id: productId,
        title: 'Default Option',
        sku: generateCleanSku(productTitle, 'DEFAULT'),
        price: basePrice,
        cost_price: costPrice,
        option_combination: {},
        is_enabled: true,
      },
    ];
  }

  // Cartesian product calculation
  function cartesian(arr: { name: string; values: string[] }[]): Record<string, string>[] {
    return arr.reduce<Record<string, string>[]>(
      (acc, curr) => {
        const result: Record<string, string>[] = [];
        acc.forEach((prevCombination) => {
          curr.values.forEach((val) => {
            result.push({
              ...prevCombination,
              [curr.name]: val,
            });
          });
        });
        return result;
      },
      [{}]
    );
  }

  const combinations = cartesian(
    activeOptions.map((opt) => ({ name: opt.name, values: opt.values }))
  );

  return combinations.map((combo, index) => {
    const titleParts = Object.values(combo);
    const title = titleParts.join(' / ');
    const skuCode = Object.values(combo)
      .map((v) => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase())
      .join('-');

    return {
      id: `var-${productId}-${index}-${Date.now()}`,
      product_id: productId,
      title,
      sku: generateCleanSku(productTitle, skuCode),
      price: basePrice,
      cost_price: costPrice,
      option_combination: combo,
      is_enabled: true,
    };
  });
}

function generateCleanSku(productTitle: string, suffix: string): string {
  const prefix = productTitle
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((word) => word.substring(0, 2).toUpperCase())
    .slice(0, 3)
    .join('');

  return `${prefix || 'PRD'}-${suffix}`;
}
