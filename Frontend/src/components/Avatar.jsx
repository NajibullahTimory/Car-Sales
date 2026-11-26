import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../lib/api';

// Background image
function Avatar({ src, name, className = 'avatar' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const imageUrl = resolveMediaUrl(src);
  return (
    <span className={className}>
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={`${name || 'User'} profile`}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        name?.trim()?.slice(0, 1)?.toUpperCase() || 'M'
      )}
    </span>
  );
}

export default Avatar;
