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
    // O codigo de 4 digitos e metade da senha: quem tem o codigo entra na
    // conta. A senha saia daqui, o codigo nao — e qualquer `res.json(user)`
    // (login, /me, criar usuario no admin) devolvia os dois.
    delete values.codigo;
    // O HMAC do codigo tambem nao tem porque sair: serve so para o teste de
    // unicidade dentro do servidor.
    delete values.codigo_guardado;
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
    /**
     * Coluna legacy: o codigo de 4 digitos em texto claro, que era gravado
     * junto com a conta. Nao e mais preenchida em nenhum caminho de escrita —
     * o valor_plain novo fica em `codigo_guardado`, que e um HMAC. A coluna
     * continua aqui para que `migrarColunas` (em criarAdmin.js) possa ler e
     * apagar os valores antigos; em um banco novo ela nasce vazia.
     *
     * Ver o HMAC em `utils/codigo.js` para o porque de nao guardar em claro.
     */
    codigo: {
      type: DataTypes.STRING(4),
      allowNull: true,
      validate: {
        is: {
          args: /^\d{4}$/,
          msg: 'Código deve ter exatamente 4 dígitos',
        },
      },
    },
    /**
     * HMAC-SHA256 do codigo inicial, com indice unico. Deterministico, entao
     * dois codigos iguais colidem igual; irreversivel sem o segredo, entao
     * quem le a tabela nao consegue transformar a linha em senha de acesso.
     */
    codigo_guardado: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
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
