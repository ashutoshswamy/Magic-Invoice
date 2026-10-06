// Indian-system amount in words ("Rupees Twelve Lakh ... Only"), as printed on GST invoices.
const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const belowHundred = (n: number) =>
  n < 20 ? ones[n] : [tens[Math.floor(n / 10)], ones[n % 10]].filter(Boolean).join(" ");

const belowThousand = (n: number) =>
  [n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred` : "", belowHundred(n % 100)].filter(Boolean).join(" ");

const integerWords = (n: number): string => {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor(n / 1e5) % 100;
  const thousand = Math.floor(n / 1e3) % 100;
  const rest = n % 1000;
  return [
    crore ? `${integerWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    belowThousand(rest),
  ]
    .filter(Boolean)
    .join(" ");
};

export function amountInWords(amount: number): string {
  const paiseTotal = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  return `Rupees ${integerWords(rupees)}${paise ? ` and ${belowHundred(paise)} Paise` : ""} Only`;
}
