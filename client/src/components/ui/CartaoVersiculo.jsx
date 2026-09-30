import { Quote } from 'lucide-react';
import Card from './Card';
import ErrorMessage from './ErrorMessage';

/**
 * Cartao do versiculo do dia.
 *
 * Fica invisivel ate o versiculo chegar: um versiculo e um mimo, nao uma
 * informacao que o jogador precisa, entao falha de rede nao pode virar
 * erro de tela. O esqueleto e mostrado durante o carregamento e um erro
 * discreto substitui o conteudo se o arquivo nao vier.
 */
export default function CartaoVersiculo({ versiculo, carregando, erro }) {
  if (carregando) {
    return (
      <Card variante="destaque" className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-5 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
        />
        <p className="text-sm text-text-muted">Buscando o versículo de hoje...</p>
      </Card>
    );
  }

  if (erro) {
    // O jogo continua inteiro sem o versiculo; mostrar o erro ajuda a
    // perceber que o arquivo estatico nao foi publicado.
    return (
      <Card variante="destaque" className="py-3">
        <ErrorMessage className="text-xs">{erro}</ErrorMessage>
      </Card>
    );
  }

  if (!versiculo) return null;

  return (
    <Card variante="destaque" aria-labelledby="versiculo-do-dia">
      <p
        id="versiculo-do-dia"
        className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-wide text-primary"
      >
        <Quote size={14} aria-hidden="true" />
        Versículo do dia
      </p>
      <blockquote className="mt-2 text-sm leading-relaxed text-primary-dark">
        {versiculo.texto}
      </blockquote>
      <cite className="mt-2 block text-xs font-semibold not-italic text-text-muted">
        {versiculo.referencia}
      </cite>
    </Card>
  );
}