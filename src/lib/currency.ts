const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

