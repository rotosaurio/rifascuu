export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function calculateProgress(availableTickets: number, totalTickets: number) {
  if (!totalTickets) return 0;
  return ((totalTickets - availableTickets) / totalTickets) * 100;
}
