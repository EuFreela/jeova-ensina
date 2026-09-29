export const CATEGORIAS = {
  livros: {
    rotulo: 'Livros da Bíblia',
    descricao: 'Perguntas sobre os livros e seus conteúdos',
    tom: 'primario',
  },
  personagens: {
    rotulo: 'Personagens Bíblicos',
    descricao: 'Homens e mulheres de fé',
    tom: 'acento',
  },
  evangelhos: {
    rotulo: 'Evangelhos',
    descricao: 'A vida e os ensinamentos de Jesus',
    tom: 'pro',
  },
  milagres: {
    rotulo: 'Milagres',
    descricao: 'Os sinais que Deus realizou',
    tom: 'acento',
  },
  parabolas: {
    rotulo: 'Parábolas',
    descricao: 'Histórias que Jesus contou',
    tom: 'pro',
  },
  profetas: {
    rotulo: 'Profetas',
    descricao: 'Homens que falaram por Deus',
    tom: 'primario',
  },
  mandamentos: {
    rotulo: 'Mandamentos',
    descricao: 'As leis e os princípios de Deus',
    tom: 'pro',
  },
  geografia: {
    rotulo: 'Lugares da Bíblia',
    descricao: 'Cidades, países e regiões',
    tom: 'acento',
  },
  historia: {
    rotulo: 'História',
    descricao: 'A história do povo de Deus',
    tom: 'primario',
  },
  teologia: {
    rotulo: 'Ensinos',
    descricao: 'O que a Bíblia nos ensina',
    tom: 'pro',
  },
  sabedoria: {
    rotulo: 'Sabedoria',
    descricao: 'Conselhos práticos do livro de Provérbios',
    tom: 'primario',
  },
  organizacao: {
    rotulo: 'Organização de Jeová',
    descricao: 'História e atividades',
    tom: 'acento',
  },
};

/** Nome exibido para categorias que o backend ainda nao conhece. */
export function rotuloDeCategoria(chave) {
  return CATEGORIAS[chave]?.rotulo || capitalizar(chave);
}

export function metadadosDeCategoria(chave) {
  return CATEGORIAS[chave] || {
    rotulo: capitalizar(chave),
    descricao: 'Perguntas sobre este tema bíblico',
    tom: 'primario',
  };
}

function capitalizar(texto = '') {
  return String(texto).charAt(0).toUpperCase() + String(texto).slice(1);
}
