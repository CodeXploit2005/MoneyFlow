// Literal, whitespace-tolerant Vietnamese search; never interpret user input as regex syntax.
const variants = [
  'aàáạảãâầấậẩẫăằắặẳẵ', 'eèéẹẻẽêềếệểễ',
  'iìíịỉĩ', 'oòóọỏõôồốộổỗơờớợởỡ', 'uùúụủũưừứựửữ',
  'yỳýỵỷỹ', 'dđ'
];
export const searchPattern = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  return Array.from(normalized).map(char => {
    if (/\s/.test(char)) return '\\s+';
    const group = variants.find(letters => letters[0] === char);
    return group ? `[${group}]` : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('').replace(/(?:\\s\+)+/g, '\\s+');
};
export const textSearch = (fields: string[], pattern: string) => ({
  $or: fields.map(field => ({ [field]: { $regex: pattern, $options: 'i' } }))
});
