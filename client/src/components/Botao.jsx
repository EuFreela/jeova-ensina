const VARIANTES = {
  primaria:
    'bg-primaria text-fundo hover:bg-primaria-escura active:scale-[0.98] shadow-lg shadow-primaria/20',
  secundario: 'bg-secundaria text-texto hover:bg-fundo-claro active:scale-[0.98]',
  contorno: 'border-2 border-primaria/60 text-primaria hover:bg-primaria/10 active:scale-[0.98]',
  fantasma: 'text-texto-suave hover:text-texto hover:bg-white/5 active:scale-[0.98]',
  perigo: 'bg-erro/90 text-white hover:bg-erro active:scale-[0.98]',
};

const TAMANHOS = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Botao({
  children,
  variante = 'primaria',
  tamanho = 'md',
  carregando = false,
  desabilitado = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={desabilitado || carregando}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold',
        'transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante] || VARIANTES.primaria,
        TAMANHOS[tamanho] || TAMANHOS.md,
        className,
      ].join(' ')}
      {...props}
    >
      {carregando && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
