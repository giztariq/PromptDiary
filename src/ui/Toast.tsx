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
      className="fixed bottom-6 right-6 z-20 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg"
    >
      {message}
    </p>
  );
}
