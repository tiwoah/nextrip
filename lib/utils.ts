import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string = 'CAD'): string {
  // If it's a common symbol, just prepend it
  const symbols = ['$', '€', '£', '¥', '₫'];
  if (symbols.includes(currency)) {
    return `${currency}${amount.toLocaleString()}`;
  }

  // Handle CAD specifically with C$ if preferred or just use Intl
  if (currency === 'CAD') {
    return `C$${amount.toLocaleString()}`;
  }

  // Otherwise try Intl or fallback
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.length === 3 ? currency : 'CAD',
    }).format(amount);
  } catch {
    return `${currency}${amount.toLocaleString()}`;
  }
}
