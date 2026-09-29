const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

class User extends Model {
  async checkPassword(plain) {
    return bcrypt.compare(plain, this.password);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Nome de usuário é obrigatório' },
        len: {
          args: [3, 50],
          msg: 'Nome de usuário deve ter entre 3 e 50 caracteres',
        },
        is: {
          args: /^[a-zA-Z0-9_.-]+$/,
          msg: 'Nome de usuário só pode conter letras, números, ponto, hífen e underscore',
        },
      },
    },
    // A senha inicial e o codigo de 4 digitos gerado pelo admin, que vale
    // por 5 minutos. Depois do primeiro acesso o usuario troca por uma senha
    // de verdade (a politica real de 8+ caracteres fica no alterarSenha).
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Senha é obrigatória' },
        len: {
          args: [4, 255],
          msg: 'Senha deve ter no mínimo 4 caracteres',
        },
      },
    },
    // Opt-in do jogador: com false, o ranking solo dele some da lista dos
    // outros, mas ele continua vendo a propria posicao. Vale so para o solo.
    ranking_publico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // RBAC: 'admin' gerencia usuarios; 'player' apenas joga.
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'player',
      validate: {
        isIn: {
          args: [['admin', 'player']],
          msg: 'Perfil de acesso inválido',
        },
      },
    },
    // Enquanto a senha expirar, o login so aceita o codigo de 4 digitos.
    // Zera assim que o usuario troca a senha no primeiro acesso.
    senha_expira_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Codigo curto de 4 digitos, criado junto com a conta para o jogador
    // identificar e memorizar o seu acesso.
    codigo: {
      type: DataTypes.STRING(4),
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^\d{4}$/,
          msg: 'Código deve ter exatamente 4 dígitos',
        },
      },
    },
    // Obriga a troca da senha provisoria no primeiro acesso.
    must_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

module.exports = User;
