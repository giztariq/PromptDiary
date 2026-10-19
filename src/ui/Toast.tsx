interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-20 rounded-control border border-ink bg-ink px-4 py-3 text-sm font-semibold text-surface shadow-md"
    >
      {message}
    </p>
  );
}
