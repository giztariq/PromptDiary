import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message || !visible) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="toast-enter fixed bottom-6 right-6 z-20 rounded-control border border-ink bg-ink px-4 py-3 text-sm font-semibold text-surface shadow-md"
    >
      {message}
    </p>
  );
}
