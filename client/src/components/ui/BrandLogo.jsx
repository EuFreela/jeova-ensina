import BibliaAberta from '../illustrations/BibliaAberta';

const TAMANHOS = {
  sm: { icone: 'h-6', texto: 'text-base' },
  md: { icone: 'h-8', texto: 'text-lg' },
  lg: { icone: 'h-10', texto: 'text-2xl sm:text-3xl' },
};

/** Marca do jogo: Biblia aberta em azul e dourado + nome "Jeová Ensina". */
export default function BrandLogo({ tamanho = 'md', mostrarNome = true, className = '' }) {
  const medidas = TAMANHOS[tamanho] || TAMANHOS.md;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BibliaAberta className={`${medidas.icone} w-auto shrink-0`} />
      {mostrarNome && (
        <span className={`font-display font-bold tracking-tight text-primary-dark ${medidas.texto}`}>
          Jeová Ensina
        </span>
      )}
    </span>
  );
}
