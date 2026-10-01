import api from './api';

const LOCAL_PERGUNTAS_URL = '/data/perguntas.json';

/**
 * Ultimo recurso quando nem a API nem o arquivo local respondem. Mantida aqui
 * para que o /quiz nunca fique sem questão alguma, mesmo em um estado
 * intermediário (cache quebrado, build parcial).
 */
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

/**
 * As opções são embaralhadas a cada partida.
 *
 * No modo API o servidor NÃO envia `resposta_correta` (o gabarito saiu uma
 * pergunta por vez em `verificarResposta`). No modo local (fallback) o gabarito
 * existe no arquivo estatico, e e usado apenas para feedback offline — partidas
 * locais nunca sao salvas no ranking.
 */
function preparar(perguntas) {
  return embaralhar(perguntas).map((p) => {
    const temGabarito = Object.prototype.hasOwnProperty.call(p, 'resposta_correta')
      && p.resposta_correta !== null && p.resposta_correta !== undefined;
    const opcoes = p.opcoes.map((texto, indice) => ({ texto, indice }));
    const embaralhadas = embaralhar(opcoes);
    const novoIndice = temGabarito
      ? embaralhadas.findIndex((o) => o.indice === p.resposta_correta)
      : null;
    return {
      ...p,
      opcoes: embaralhadas.map((o) => o.texto),
      ...(temGabarito ? { resposta_correta: novoIndice } : {}),
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
 *
 * `rodada` e o token que o servidor emite junto das perguntas. Ele precisa
 * voltar em `salvarPontuacao()`: e o que prova ao servidor que estas respostas
 * sao de perguntas que ele entregou. No modo local nao existe rodada, e o
 * servidor nunca aceita a partida.
 */
export async function buscarPerguntas({ limite = 10, categoria, dificuldade } = {}) {
  try {
    const { data } = await api.get('/perguntas', {
      params: { limite, categoria, dificuldade },
    });
    if (Array.isArray(data.perguntas) && data.perguntas.length) {
      return { perguntas: preparar(data.perguntas), origem: 'api', rodada: data.rodada || null };
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
    const finita = filtradas.length ? filtradas : locais;
    return { perguntas: preparar(finita).slice(0, limite), origem: 'local', rodada: null };
  }
}

/**
 * Veredito do servidor para UMA pergunta.
 *
 * O jogo precisa dizer na hora se o jogador acertou, e dizer qual era a resposta
 * certa. Esse dado sai daqui, pergunta por pergunta, e so depois que a escolha
 * foi feita — e nao junto com a lista de perguntas, que entregaria o gabarito
 * inteiro de uma vez.
 *
 * Devolve `null` quando nao ha veredito (rede caiu, teto de requisicoes, sessao
 * expirada). `null` e diferente de `{ correta: false }` de proposito: quem chama
 * precisa distinguir "errou" de "nao deu para saber", porque sao coisas bem
 * diferentes para quem estava jogando. Transformar silencio em "errado!" custaria
 * uma vida ao jogador por um erro que nao foi dele.
 */
export async function verificarResposta({ rodada, perguntaId, resposta }) {
  try {
    const { data } = await api.post('/perguntas/responder', { rodada, perguntaId, resposta });
    return { correta: Boolean(data.correta), respostaCorreta: data.respostaCorreta ?? null };
  } catch {
    return null;
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

/**
 * Confirma se uma categoria tem perguntas antes de liberar o inicio da partida.
 * Retorna null quando nao foi possivel verificar (offline): nesse caso o
 * inicio nao e bloqueado, pois /quiz ainda tem o fallback local.
 */
export async function verificarCategoria(categoria) {
  if (!categoria || categoria === 'todas') return true;

  try {
    const { data } = await api.get('/perguntas', { params: { limite: 1, categoria } });
    return Array.isArray(data.perguntas) && data.perguntas.length > 0;
  } catch {
    return null;
  }
}
