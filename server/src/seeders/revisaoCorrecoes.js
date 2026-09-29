/**
 * Correcoes da revisao biblica das perguntas.
 *
 * Cada item lista o id da pergunta (os ids do banco = posicao+1 no seed) e os
 * campos a corrigir. Aplicado no seed (perguntas.json) e no banco SQLite,
 * preservando todos os ids e relacionamentos.
 */
module.exports = [
  {
    id: 29,
    motivo: 'A Biblia chama o povo que saiu do Egito de filhos de Israel, e nao de hebreus (termo usado para os patriarcas).',
    campos: { opcoes: ['Os cananeus', 'Os israelitas (filhos de Israel)', 'Os filisteus', 'Os amalequitas'] },
  },
  {
    id: 36,
    motivo: 'Alinhado a TNM: a ultima ceia instituiu a Meal Memorial (comemoracao), com pao e calice como sinais.',
    campos: {
      opcoes: [
        'Construiu uma nova tenda',
        'Partiu o pão e tomou o cálice, instituindo a Meal Memorial (comemoração)',
        'Chamou os discípulos para pescar',
        'Lavou o chão da sala',
      ],
    },
  },
  {
    id: 37,
    motivo: 'Mensagem do anjo em Mateus 28:6: foi ressuscitado (passado) e vos precedera ate a Galileia.',
    campos: {
      opcoes: [
        'Esperem aqui três dias',
        'Vão comprar perfumes',
        'Não contem a ninguém',
        'Não está aqui: foi ressuscitado e vos precederá até a Galiléia',
      ],
    },
  },
  {
    id: 46,
    motivo: 'A autoria de Lamentacoes esta em Jeremias 36; a referencia anterior (Lamentacoes 5:18) nao a sustenta.',
    campos: { referencia: 'Jeremias 36; Lamentações 1-5' },
  },
  {
    id: 48,
    motivo: 'Príncipe dos Profetas e um titulo da tradicao judaica, nao uma declaracao da Biblia.',
    campos: {
      pergunta: "Qual profeta é chamado de 'Príncipe dos Profetas' (título tradicional, não declarado na Bíblia)?",
      referencia: 'Isaías 6:1-8 (título da tradição judaica)',
    },
  },
  {
    id: 53,
    motivo: 'ERRO: Josue 10:12-13 diz que o sol parou enquanto Israel combatia os AMORREUS. Amalequitas estava como resposta correta e nem era alternativa valida.',
    campos: {
      opcoes: ['Os cananeus', 'Os amorreus', 'Os filisteus', 'Os midianos'],
      resposta_correta: 1,
      referencia: 'Josué 10:6, 12-13',
    },
  },
  {
    id: 54,
    motivo: 'O distrator dois irmaos que brigam pela heranca tambem descrevia a parabola e gerava duvida; trocado por algo fora do texto.',
    campos: {
      opcoes: [
        'Um filho que sai de casa e depois retorna',
        'Um servo servido injustiçadamente',
        'Um servo que foge de seu senhor',
        'Um rei que perde o trono',
      ],
    },
  },
  {
    id: 56,
    motivo: 'Proverbios 11:14 fala em a multidao de conselhos (termo da TNM).',
    campos: {
      opcoes: [
        'A força das muralhas',
        'A multidão de conselhos',
        'A riqueza do rei',
        'O número de soldados',
      ],
    },
  },
  {
    id: 58,
    motivo: 'Evangelho da Caridade e um titulo catolico tradicional (Agostinho), nao biblico. Virou pergunta ancorada em 1 Joao 4:8.',
    campos: {
      pergunta: "Em qual livro do Novo Testamento lemos que 'Deus é amor'?",
      referencia: '1 João 4:8-20',
    },
  },
  {
    id: 59,
    motivo: 'A referencia Romanos 1:1 nao sustenta a carta mais longa; Romanos tem 16 capitulos.',
    campos: { referencia: 'Romanos 1-16' },
  },
  {
    id: 68,
    motivo: '1 Corintios 13:13 diz que o amor e o maior DOS TRES (fe, esperanca e amor), e nao o maior de todos.',
    campos: {
      opcoes: [
        'O amor é o maior dos três: fé, esperança e amor',
        'O amor é o primeiro de todos',
        'O amor é o mais difícil',
        'O amor é o mais antigo',
      ],
    },
  },
  {
    id: 69,
    motivo: 'A idade de 40 anos esta em 1 Samuel 9:2, e nao em 1 Samuel 13:1 (que fala do inicio do reinado).',
    campos: { referencia: '1 Samuel 9:2, 10:1, 24' },
  },
  {
    id: 70,
    motivo: 'A contagem de "assim seja" era fragil e ambigua (Lucas 11 traz a mesma oracao). Trocada por pergunta ancorada em Joao 6:27-58.',
    campos: {
      pergunta: 'Segundo João 6, que alimento Jesus apresenta como essencial para obter a vida eterna?',
      opcoes: ['O pão da vida', 'O maná do deserto', 'As ofertas do templo', 'A fruta da árvore da vida'],
      resposta_correta: 0,
      referencia: 'João 6:27-58',
    },
  },
  {
    id: 71,
    motivo: 'A montanha da transfiguracao nao e nomeada na Biblia; o Tabor e a identificacao tradicional.',
    campos: {
      pergunta: 'Segundo a tradição, em que monte Jesus se transfigurou diante dos discípulos? (a montanha não é nomeada na Bíblia)',
    },
  },
  {
    id: 74,
    motivo: 'Duplicidade com a #64 (ambas testavam a videira verdadeira pelo numero do capitulo). Agora testa o destino da videira em Ezequiel 15.',
    campos: {
      pergunta: 'Segundo Ezequiel 15, o que o profeta diz que acontecerá com a videira que não dá bons frutos?',
      opcoes: [
        'Ela será entregue ao fogo e não dará fruto',
        'Ela será levada ao templo de Jerusalém',
        'Ela será multiplicada no Egito',
        'Ela se tornará a videira do rei',
      ],
      resposta_correta: 0,
      referencia: 'Ezequiel 15:4-8',
    },
  },
  {
    id: 79,
    motivo: 'Enunciado com palavra inglesa (righteousness) e resposta imprecisa. Genesis 15:6 conta como justica o fato de ele ter acreditado em Jeova.',
    campos: {
      pergunta: 'Segundo Gênesis 15:6, o que fez a fé de Abraão ser contada como justiça?',
      opcoes: [
        'Ele acreditou em Jeová',
        'As obras que praticou',
        'A linhagem de seu pai',
        'As ofertas do templo',
      ],
      resposta_correta: 0,
      referencia: 'Gênesis 15:6; Romanos 4:3-5; Hebreus 11:1-8',
    },
  },
];
