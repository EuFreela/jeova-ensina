import { useId } from 'react';

export default function Input({
  label,
  erro,
  dica,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  const id = useId();
  const idDescricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="font-display text-sm font-medium text-texto-suave">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={Boolean(erro)}
        aria-describedby={idDescricao}
        className={[
          'w-full rounded-xl border bg-fundo/70 px-4 py-3 text-texto placeholder:text-texto-suave/60',
          'transition-colors duration-200 focus:outline-none',
          erro ? 'border-erro focus:border-erro' : 'border-white/15 focus:border-primaria',
          className,
        ].join(' ')}
        {...props}
      />
      {erro ? (
        <p id={idDescricao} className="text-sm text-erro">
          {erro}
        </p>
      ) : dica ? (
        <p id={idDescricao} className="text-xs text-texto-suave/80">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
