const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

class Pontuacao extends Model {}

Pontuacao.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    pontuacao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'Pontuação deve ser um número inteiro' },
        min: 0,
      },
    },
    acertos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    total_perguntas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    /**
     * 'solo'      -> jogo individual (o jogador nao tem ninguem para ultrapassar).
     * 'campeonato' -> jogo com outras pessoas, disputando pontuacao entre si.
     * Os dois ficam em rankings separados, pois a pontuacao nao e comparable:
     * no campeonato a mesma nota pode render primeiro ou ultimo.
     */
    modo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'solo',
      validate: {
        isIn: {
          args: [['solo', 'campeonato']],
          msg: 'Modo de jogo inválido',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Pontuacao',
    tableName: 'pontuacoes',
    indexes: [{ fields: ['user_id'] }, { fields: ['pontuacao'] }, { fields: ['modo'] }],
  }
);

Pontuacao.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Pontuacao, { foreignKey: 'user_id', as: 'pontuacoes' });

module.exports = Pontuacao;
