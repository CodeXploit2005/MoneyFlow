export async function readAvatarFile(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Vui lòng chọn ảnh nhỏ hơn 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Không đọc được ảnh. Vui lòng chọn tệp khác.')); image.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 256, 256);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}
