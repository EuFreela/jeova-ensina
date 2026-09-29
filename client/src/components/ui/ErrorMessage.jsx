export default function ErrorMessage({ children, className = '' }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className={`rounded-field border border-error/30 bg-error-light px-4 py-3 text-sm text-error ${className}`}
    >
      {children}
    </div>
  );
}
