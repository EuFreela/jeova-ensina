export default function EmptyState({ icone, titulo, descricao, children, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center ${className}`}
    >
      {icone && (
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-full bg-primary-light text-primary"
        >
          {icone}
        </span>
      )}
      {titulo && <h3 className="text-base font-semibold text-primary-dark">{titulo}</h3>}
      {descricao && <p className="max-w-xs text-sm text-text-muted">{descricao}</p>}
      {children}
    </div>
  );
}
