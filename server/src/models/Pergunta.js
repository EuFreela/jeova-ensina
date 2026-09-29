const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const DIFICULDADES = ['facil', 'medio', 'dificil'];

/** `opcoes` e guardado como JSON; aceita string ou array. */
function saoOpcoesValidas(value) {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(parsed) && parsed.length >= 2;
}
saoOpcoesValidas.msg = 'Opções devem ser um array com pelo menos 2 itens';

class Pergunta extends Model {
  static get DIFICULDADES() {
    return DIFICULDADES;
  }

  toJSON() {
    const { opcoes, ...rest } = this.get();
    let parsed = opcoes;
    if (typeof opcoes === 'string') {
      try {
        parsed = JSON.parse(opcoes);
      } catch {
        parsed = [];
      }
    }
    return { ...rest, opcoes: parsed };
  }
}

Pergunta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pergunta: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: 'Pergunta é obrigatória' } },
    },
    opcoes: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('opcoes');
        if (!raw) return [];
        if (typeof raw === 'object') return raw;
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue('opcoes', JSON.stringify(value));
      },
      // No Sequelize 6 o validador de atributo precisa ser uma funcao pura;
      // a mensagem vai pendurada nela. O formato com { validator, msg }
      // quebra em qualquer save() com "Invalid validator function".
      validate: {
        saoOpcoesValidas,
      },
    },
    resposta_correta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Resposta correta deve ser um índice inteiro' },
        min: 0,
        max: 3,
      },
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'geral',
    },
    dificuldade: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'facil',
      validate: {
        isIn: { args: [DIFICULDADES], msg: `Dificuldade deve ser uma de: ${DIFICULDADES.join(', ')}` },
      },
    },
    referencia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Pergunta',
    tableName: 'perguntas',
  }
);

module.exports = Pergunta;
