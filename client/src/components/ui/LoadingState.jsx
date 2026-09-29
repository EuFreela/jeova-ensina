export default function LoadingState({ mensagem = 'Carregando...', className = '' }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}
    >
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-[3px] border-primary-light border-t-primary"
      />
      <p className="text-sm text-text-muted">{mensagem}</p>
    </div>
  );
}
