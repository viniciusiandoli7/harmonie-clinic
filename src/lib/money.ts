export function roundMoney(value: number | null | undefined) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function calculateNetAmount(input: {
  amount: number;
  type?: "INCOME" | "EXPENSE";
  feeAmount?: number | null;
  cardFeePercent?: number | null;
  commissionAmount?: number | null;
  netAmount?: number | null;
}) {
  const grossAmount = roundMoney(input.amount);
  const feeAmount = input.feeAmount !== undefined && input.feeAmount !== null
    ? roundMoney(input.feeAmount)
    : input.cardFeePercent
      ? roundMoney(grossAmount * (Number(input.cardFeePercent) / 100))
      : 0;
  const commissionAmount = roundMoney(input.commissionAmount || 0);
  const netAmount = input.netAmount !== undefined && input.netAmount !== null
    ? roundMoney(input.netAmount)
    : input.type === "INCOME"
      ? roundMoney(grossAmount - feeAmount - commissionAmount)
      : grossAmount;

  return { grossAmount, feeAmount, commissionAmount, netAmount };
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthBounds(month?: string | null) {
  const [year, monthIndex] = month && /^\d{4}-\d{2}$/.test(month)
    ? month.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];
  const startDate = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, monthIndex, 0, 23, 59, 59, 999);
  return { month: monthKey(startDate), startDate, endDate };
}
