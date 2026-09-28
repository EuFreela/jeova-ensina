import api from './api';

const LOCAL_PERGUNTAS_URL = '/data/perguntas.json';

const FALLBACK_LOCAL = [
  {
    id: 'local-1',
    pergunta: 'Quem foi o primeiro ser humano criado por Deus?',
    opcoes: ['Eva', 'Caim', 'Abel', 'Adão'],
    resposta_correta: 3,
    dificuldade: 'facil',
    categoria: 'personagens',
    referencia: 'Gênesis 2:7',
  },
  {
    id: 'local-2',
    pergunta: 'Quantos livros tem a Bíblia completa?',
    opcoes: ['66', '27', '39', '12'],
    resposta_correta: 0,
    dificuldade: 'facil',
    categoria: 'livros',
    referencia: '2 Timóteo 3:16',
  },
  {
    id: 'local-3',
    pergunta: 'Onde Jesus nasceu?',
    opcoes: ['Nazaré', 'Jerusalém', 'Belém', 'Cafarnaum'],
    resposta_correta: 2,
    dificuldade: 'facil',
    categoria: 'geografia',
    referencia: 'Lucas 2:4-7',
  },
  {
    id: 'local-4',
    pergunta: 'Quem foi o primeiro rei de Israel?',
    opcoes: ['Davi', 'Salomão', 'Samuel', 'Saul'],
    resposta_correta: 3,
    dificuldade: 'facil',
    categoria: 'personagens',
    referencia: '1 Samuel 10:1, 24',
  },
  {
    id: 'local-5',
    pergunta: 'Quantos mandamentos Deus entregou a Moisés no Monte Sinai?',
    opcoes: ['5', '10', '12', '3'],
    resposta_correta: 1,
    dificuldade: 'facil',
    categoria: 'mandamentos',
    referencia: 'Êxodo 20:1-17',
  },
];

function embaralhar(lista) {
  const arr = [...lista];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function preparar(perguntas) {
  return embaralhar(perguntas).map((p) => {
    const opcoes = p.opcoes.map((texto, indice) => ({ texto, indice }));
    const embaralhadas = embaralhar(opcoes);
    return {
      ...p,
      opcoes: embaralhadas.map((o) => o.texto),
      resposta_correta: embaralhadas.findIndex((o) => o.indice === p.resposta_correta),
    };
  });
}

async function carregarLocais() {
  try {
    const resposta = await fetch(LOCAL_PERGUNTAS_URL);
    if (!resposta.ok) throw new Error('sem fallback local');
    const dados = await resposta.json();
    return Array.isArray(dados) && dados.length ? dados : FALLBACK_LOCAL;
  } catch {
    return FALLBACK_LOCAL;
  }
}

/**
 * Busca perguntas na API. Se a API falhar (offline, servidor fora do ar),
 * cai para o arquivo local em /public/data/perguntas.json.
 */
export async function buscarPerguntas({ limite = 10, categoria, dificuldade } = {}) {
  try {
    const { data } = await api.get('/perguntas', {
      params: { limite, categoria, dificuldade },
    });
    if (Array.isArray(data.perguntas) && data.perguntas.length) {
      return { perguntas: preparar(data.perguntas), origem: 'api' };
    }
    throw new Error('API respondeu sem perguntas');
  } catch {
    const locais = await carregarLocais();
    let filtradas = locais;
    if (categoria && categoria !== 'todas') {
      filtradas = filtradas.filter((p) => p.categoria === categoria);
    }
    if (dificuldade && dificuldade !== 'todas') {
      filtradas = filtradas.filter((p) => p.dificuldade === dificuldade);
    }
    const finitas = filtradas.length ? filtradas : locais;
    return { perguntas: preparar(finita).slice(0, limite), origem: 'local' };
  }
}

export async function buscarCategorias() {
  try {
    const { data } = await api.get('/perguntas/categorias');
    return data.categorias || [];
  } catch {
    return [];
  }
}

export async function salvarPontuacao(respostas) {
  const { data } = await api.post('/pontuacoes', { respostas });
  return data;
}

export async function buscarRanking() {
  const { data } = await api.get('/pontuacoes/ranking');
  return data;
}

export async function buscarMinhasPontuacoes() {
  const { data } = await api.get('/pontuacoes/eu');
  return data;
}
