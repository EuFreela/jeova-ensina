function iniciaisDe(nome = '') {
  const partes = String(nome).trim().split(/[\s._-]+/).filter(Boolean);
  if (!partes.length) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const TAMANHOS = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
};

export default function Avatar({ nome, tamanho = 'md', className = '' }) {
  const iniciais = iniciaisDe(nome);

  return (
    <span
      aria-hidden="true"
      className={[
        'grid shrink-0 place-items-center rounded-full',
        'bg-primary-light font-display font-bold text-primary select-none',
        TAMANHOS[tamanho] || TAMANHOS.md,
        className,
      ].join(' ')}
    >
      {iniciais}
    </span>
  );
}
