import React, { useEffect, useState } from 'react';

export const Avatar: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({src, alt = 'Ảnh đại diện', ...props}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img {...props} src={!src || failed ? '/default-avatar.svg' : src} alt={alt} onError={() => setFailed(true)} />;
};
