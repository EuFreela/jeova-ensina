const VARIANTES = {
  padrao: 'border border-line bg-surface text-text shadow-panel',
  destaque: 'border border-primary/25 bg-primary-light',
  plano: 'border border-transparent bg-transparent',
};

const VARIANTES_AO_CLICAR =
  'cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-raised active:scale-[0.99]';

export default function Card({
  children,
  variante = 'padrao',
  aoClicar,
  className = '',
  ...props
}) {
  const Elemento = aoClicar ? 'button' : 'div';

  return (
    <Elemento
      type={aoClicar ? 'button' : undefined}
      onClick={aoClicar}
      className={[
        'w-full rounded-card p-5 text-left',
        VARIANTES[variante] || VARIANTES.padrao,
        aoClicar ? VARIANTES_AO_CLICAR : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Elemento>
  );
}
