/**
 * Format number as Indian Rupee (₹) with Indian digit grouping (Lakhs, Crores)
 * e.g., 1234567.89 -> ₹12,34,567.89
 */
export function formatCurrency(amount: number | null | undefined, includeSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering grouping
  // Last 3 digits, then groups of 2
  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);
    const otherGroups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${otherGroups},${lastThree}`;
  } else {
    result = integerPart;
  }

  const formatted = `${result}.${decimalPart}`;
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${formatted}`;
}

/**
 * Compact Indian currency representation (e.g., ₹12.5 L, ₹1.4 Cr, ₹45.2 K)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 10000000) {
    formatted = `${(abs / 10000000).toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    formatted = `${(abs / 100000).toFixed(2)} L`;
  } else if (abs >= 1000) {
    formatted = `${(abs / 1000).toFixed(1)} K`;
  } else {
    formatted = abs.toFixed(0);
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Format date in DD/MM/YYYY
 */
export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date time in DD/MM/YYYY, hh:mm A
 */
export function formatDateTime(dateString?: string | Date | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  const datePart = formatDate(d);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  return `${datePart} ${strHours}:${minutes} ${ampm}`;
}

/**
 * Converts numbers into Indian words format for GST Invoices
 * e.g., 125000 -> "One Lakh Twenty Five Thousand Rupees Only"
 */
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return `${b[Math.floor(n / 10)]} ${a[digit]}`.trim();
  }

  const rounded = Math.round(num);
  let crore = Math.floor(rounded / 10000000);
  let lakh = Math.floor((rounded % 10000000) / 100000);
  let thousand = Math.floor((rounded % 100000) / 1000);
  let hundred = Math.floor((rounded % 1000) / 100);
  let remainder = rounded % 100;

  let str = '';
  if (crore > 0) str += `${inWords(crore)} Crore `;
  if (lakh > 0) str += `${inWords(lakh)} Lakh `;
  if (thousand > 0) str += `${inWords(thousand)} Thousand `;
  if (hundred > 0) str += `${inWords(hundred)} Hundred `;
  if (remainder > 0) {
    if (str !== '') str += 'and ';
    str += inWords(remainder);
  }

  return `${str.trim()} Rupees Only`;
}
