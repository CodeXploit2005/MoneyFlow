export const cleanCustomerName = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');
export const cleanCustomerPhone = (value: string) => {
  const phone = value.trim().replace(/[\s().-]/g, '');
  return /^(?:\+84|0084|84)[35789]\d{8}$/.test(phone) ? '0' + phone.replace(/^(?:\+84|0084|84)/, '') : phone;
};
export const customerContactFilter = (phone: string, email: string) => {
  const contacts: any[] = [];
  if (phone) {
    // Include legacy numbers with spaces, punctuation or a Vietnamese country code.
    const digits = phone.replace(/\D/g, '');
    const body = digits.startsWith('0') && digits.length === 10
      ? `(?:0|\\+84|0084|84)[\\s().-]*${digits.slice(1).split('').join('[\\s().-]*')}`
      : '\\+?' + digits.split('').join('[\\s().-]*');
    if (body) contacts.push({ phone: { $regex: `^${body}$` } });
  }
  if (email) contacts.push({ email: { $regex: '^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', $options: 'i' } });
  return contacts.length ? { $or: contacts } : null;
};
