import { forwardRef } from 'react';

const VARIANTES = {
  contorno: 'border border-line bg-surface text-primary hover:border-primary hover:bg-primary-light',
  neutro: 'border border-line bg-surface text-text hover:bg-background',
  fantasma: 'text-secondary hover:bg-primary-light hover:text-primary',
  perigo: 'border border-error/30 bg-surface text-error hover:bg-error-light',
};

const TAMANHOS = {
  sm: 'min-h-9 px-4 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-[15px]',
  lg: 'min-h-12 px-6 py-3 text-base',
};

const SecondaryButton = forwardRef(function SecondaryButton(
  {
    children,
    variante = 'contorno',
    tamanho = 'md',
    carregando = false,
    desabilitado = false,
    larguraTotal = false,
    icone,
    iconeFim,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={desabilitado || carregando}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-button font-semibold',
        'transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante] || VARIANTES.contorno,
        TAMANHOS[tamanho] || TAMANHOS.md,
        larguraTotal ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {carregando ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icone
      )}
      {children}
      {!carregando && iconeFim}
    </button>
  );
});

export default SecondaryButton;
