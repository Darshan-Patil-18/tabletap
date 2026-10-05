import { useEffect, useState } from 'react';

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div className="toast fade-in">
      {message}
    </div>
  );
}
