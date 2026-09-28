const PONTOS_POR_DIFICULDADE = {
  facil: 10,
  medio: 20,
  dificil: 30,
};

const BONS_COMBOS = [
  { sequencia: 5, bonus: 15 },
  { sequencia: 3, bonus: 5 },
];

/**
 * Recalcula a pontuacao no servidor a partir das respostas enviadas.
 * O cliente nunca define a pontuacao final: ela e sempre derivada aqui
 * para evitar envio de numeros adulterados.
 *
 * @param {Array<{perguntaId:number, correta:boolean, dificuldade?:string}>} respostas
 * @param {Map<number, string>} dificuldadesPorId
 */
function calcularPontuacao(respostas, dificuldadesPorId = new Map()) {
  let pontos = 0;
  let acertos = 0;
  let combo = 0;
  let bonusTotal = 0;
  const detalhes = [];

  respostas.forEach((resposta) => {
    const dificuldade = resposta.dificuldade || dificuldadesPorId.get(resposta.perguntaId) || 'facil';
    const valor = PONTOS_POR_DIFICULDADE[dificuldade] ?? PONTOS_POR_DIFICULDADE.facil;

    if (resposta.correta) {
      acertos += 1;
      pontos += valor;
      combo += 1;
      let bonus = 0;
      for (const regra of BONS_COMBOS) {
        if (combo === regra.sequencia) {
          bonus = regra.bonus;
          break;
        }
      }
      if (bonus > 0) {
        pontos += bonus;
        bonusTotal += bonus;
      }
      detalhes.push({
        perguntaId: resposta.perguntaId,
        correta: true,
        dificuldade,
        pontos: valor,
        bonus,
        combo,
      });
    } else {
      combo = 0;
      detalhes.push({
        perguntaId: resposta.perguntaId,
        correta: false,
        dificuldade,
        pontos: 0,
        bonus: 0,
        combo: 0,
      });
    }
  });

  return {
    pontuacao: pontos,
    acertos,
    total_perguntas: respostas.length,
    bonusTotal,
    comboMaximo: Math.max(0, ...detalhes.map((d) => d.combo)),
    detalhes,
  };
}

module.exports = { PONTOS_POR_DIFICULDADE, BONS_COMBOS, calcularPontuacao };
