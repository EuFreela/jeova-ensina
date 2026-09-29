export default function ProgressBar({ valor = 0, rotulo, className = '' }) {
  const percentual = Math.min(100, Math.max(0, Math.round(valor)));

  return (
    <div
      role="progressbar"
      aria-valuenow={percentual}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
      className={`h-2 overflow-hidden rounded-full bg-primary-light ${className}`}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${percentual}%` }}
      />
    </div>
  );
}
