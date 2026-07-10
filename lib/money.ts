export function formatMoney(amountCents: number) {
  return `KSH ${(amountCents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
