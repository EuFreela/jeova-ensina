import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function InputField({
  label,
  icone,
  erro,
  dica,
  senha = false,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}) {
  const id = useId();
  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;
  const [visivel, setVisivel] = useState(false);

  const idDescrito = erro ? idErro : dica ? idDica : undefined;
  // Para campos de senha o tipo e controlado pelo botao de mostrar/ocultar.
  const tipo = senha ? (visivel ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-primary-dark">
          {label}
        </label>
      )}

      <div className="relative">
        {icone && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-secondary"
          >
            {icone}
          </span>
        )}

        <input
          id={id}
          type={tipo}
          aria-invalid={Boolean(erro)}
          aria-describedby={idDescrito}
          className={[
            'w-full min-h-12 rounded-field border bg-surface text-[15px] text-text',
            'placeholder:text-text-muted',
            'transition-colors duration-200 focus:outline-none',
            icone ? 'pl-11' : 'pl-4',
            senha ? 'pr-12' : 'pr-4',
            erro
              ? 'border-error focus:border-error'
              : 'border-line focus:border-primary',
            'disabled:cursor-not-allowed disabled:bg-background disabled:text-text-muted',
            className,
          ].join(' ')}
          {...props}
        />

        {senha && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visivel}
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-field text-secondary transition-colors hover:text-primary"
          >
            {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>

      {erro ? (
        <p id={idErro} role="alert" className="text-sm text-error">
          {erro}
        </p>
      ) : dica ? (
        <p id={idDica} className="text-xs text-text-muted">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
