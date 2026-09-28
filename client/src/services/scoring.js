export const PONTOS_POR_DIFICULDADE = {
  facil: 10,
  medio: 20,
  dificil: 30,
};

export const BONS_COMBOS = [
  { sequencia: 5, bonus: 15 },
  { sequencia: 3, bonus: 5 },
];

/**
 * Recalcula a pontuação durante a partida para feedback imediato.
 * O servidor refaz esse cálculo ao salvar, então ele é a fonte da verdade.
 */
export function calcularPontuacao(respostas) {
  let pontos = 0;
  let acertos = 0;
  let combo = 0;
  let comboMaximo = 0;
  let bonusTotal = 0;

  const detalhes = respostas.map((r) => {
    const valor = PONTOS_POR_DIFICULDADE[r.dificuldade] ?? PONTOS_POR_DIFICULDADE.facil;
    let bonus = 0;

    if (r.correta) {
      acertos += 1;
      pontos += valor;
      combo += 1;
      comboMaximo = Math.max(comboMaximo, combo);
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
    } else {
      combo = 0;
    }

    return { ...r, pontos: r.correta ? valor : 0, bonus, combo };
  });

  return { pontos, acertos, total: respostas.length, combo, comboMaximo, bonusTotal, detalhes };
}
