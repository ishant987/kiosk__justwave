export function Toast({ tone = 'info', children }: { tone?: 'info' | 'success' | 'error'; children: React.ReactNode }) {
  return <div className={`toast toast-${tone}`}>{children}</div>;
}
