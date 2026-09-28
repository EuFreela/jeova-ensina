function fisherYates(lista) {
  const arr = [...lista];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function embaralhar(lista) {
  return fisherYates(lista);
}

/**
 * Embaralha as opcoes de uma pergunta e ajusta o indice da resposta correta.
 */
function embaralharOpcoes(opcoes, respostaCorreta) {
  const indices = opcoes.map((_, i) => i);
  const embaralhados = embaralhar(indices);
  return {
    opcoes: embaralhados.map((i) => opcoes[i]),
    resposta_correta: embaralhados.indexOf(respostaCorreta),
  };
}

/**
 * Embaralha a lista de perguntas e, em cada uma, tambem as opcoes.
 * `comResposta=false` remove a resposta correta (usado para o ranking publico).
 */
function prepararPerguntas(perguntas, { comResposta = true } = {}) {
  return embaralhar(perguntas).map((p) => {
    const opcoes = Array.isArray(p.opcoes) ? p.opcoes : [];
    const { opcoes: novasOpcoes, resposta_correta } = embaralharOpcoes(
      opcoes,
      Number(p.resposta_correta) || 0
    );
    const base = {
      id: p.id,
      pergunta: p.pergunta,
      opcoes: novasOpcoes,
      dificuldade: p.dificuldade,
      categoria: p.categoria,
      referencia: p.referencia,
    };
    if (comResposta) {
      return { ...base, resposta_correta };
    }
    return base;
  });
}

module.exports = { embaralhar, embaralharOpcoes, prepararPerguntas };
