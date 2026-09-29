import {
  BookOpen,
  BookHeart,
  KeyRound,
  Lightbulb,
  MapPin,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react';
import { metadadosDeCategoria } from '../../services/categorias';

const ICONES = {
  livros: BookOpen,
  personagens: Users,
  evangelhos: BookHeart,
  milagres: Sparkles,
  parabolas: ScrollText,
  profetas: Sparkles,
  mandamentos: KeyRound,
  geografia: MapPin,
  historia: ScrollText,
  teologia: Lightbulb,
  sabedoria: Lightbulb,
  organizacao: Users,
};

const TONS = {
  primario: 'from-[#1E5CA8] to-[#12366A] text-white',
  pro: 'from-[#2C568A] to-[#12366A] text-white',
  agua: 'from-[#3F79BB] to-[#1E5CA8] text-white',
  acento: 'from-[#E9B95A] to-[#C08A2A] text-primary-dark',
};

/** Miniatura ilustrada de uma categoria, no formato do card da lista. */
export default function IlustraCategoria({ categoria, className = '' }) {
  const todas = categoria === 'todas';
  const { tom } = metadadosDeCategoria(categoria);
  const Icone = todas ? Sparkles : ICONES[categoria] || BookOpen;
  const classes = TONS[todas ? 'agua' : tom] || TONS.primario;

  return (
    <span
      className={`grid size-full place-items-center bg-gradient-to-br ${classes} ${className}`}
    >
      <Icone size={26} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}
