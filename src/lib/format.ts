const VND_FORMATTER = new Intl.NumberFormat("vi-VN");

export function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return "Liên hệ";

  return `${VND_FORMATTER.format(amount)}đ`;
}
