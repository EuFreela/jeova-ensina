# 🎮

# JEOVÁ ENSINA

### Plataforma de Perguntas Bíblicas em Tempo Real

**Full Stack · Web App · Multiplayer · Ranking · Administração**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge\&logo=express\&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge\&logo=socket.io\&logoColor=white)](https://socket.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge\&logo=sqlite\&logoColor=white)](https://www.sqlite.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)](https://tailwindcss.com/)
[![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge\&logo=github-actions\&logoColor=white)](https://github.com/features/actions)

**React · Node.js · Express · Socket.IO · SQLite · JWT · Tailwind CSS**

Uma plataforma web de perguntas bíblicas criada para estudo individual e partidas em grupo, permitindo que jogadores respondam simultaneamente, acompanhem pontuações e participem de rankings.

> 📖 **Estude. Responda. Compita. Aprenda.**

---

## 🧭 Navegação

* [🎯 Sobre o projeto](#-sobre-o-projeto)
* [✨ Funcionalidades](#-funcionalidades)
* [🎮 Modos de jogo](#-modos-de-jogo)
* [🏆 Sistema de rankings](#-sistema-de-rankings)
* [🔄 Fluxo do sistema](#-fluxo-do-sistema)
* [👤 Usuários e permissões](#-usuários-e-permissões)
* [🧰 Stack tecnológica](#-stack-tecnológica)
* [🏗️ Arquitetura](#️-arquitetura)
* [🔐 Segurança](#-segurança)
* [⚙️ Instalação](#️-instalação)
* [🚀 Primeiro acesso](#-primeiro-acesso)
* [🌐 Variáveis de ambiente](#-variáveis-de-ambiente)
* [📁 Estrutura do projeto](#-estrutura-do-projeto)
* [🔌 API](#-api)
* [⚡ Tempo real](#-tempo-real)
* [🎯 Pontuação](#-pontuação)
* [🧪 Testes](#-testes)
* [📚 Base de perguntas](#-base-de-perguntas)
* [📖 Documentação](#-documentação)
* [📄 Licença](#-licença)

---

# 🎯 Sobre o projeto

**Jeová Ensina** é uma aplicação web de perguntas bíblicas desenvolvida para funcionar tanto como ferramenta de estudo individual quanto como plataforma de partidas em tempo real.

O sistema permite que uma pessoa pratique sozinha, acompanhe sua evolução e apareça no ranking, ou crie uma sala multiplayer na qual diferentes jogadores respondem às mesmas perguntas simultaneamente.

A plataforma foi projetada com foco em:

* 📖 estudo e revisão de conhecimento bíblico;
* 🎮 partidas individuais e em grupo;
* ⚡ atualização de placar em tempo real;
* 🏆 rankings separados por modalidade;
* 📅 filtros de ranking por período;
* 🔐 controle de acesso e autenticação;
* 🛡️ proteção contra manipulação de pontuação;
* 👨‍💼 administração centralizada de usuários;
* 📱 utilização diretamente pelo navegador.

---

# ✨ Funcionalidades

### 🎮 Modo solo

* Partidas individuais de perguntas.
* Pontuação calculada pelo servidor.
* Sistema de bônus por sequência de acertos.
* Histórico individual.
* Participação no ranking solo.
* Filtro de ranking por período.
* Opção de privacidade para não aparecer no ranking solo.

### ⚡ Partidas em tempo real

* Criação de salas multiplayer.
* Código de acesso da sessão.
* Entrada de jogadores pelo navegador.
* Convites entre jogadores.
* Controle de presença.
* Lista de jogadores conectados.
* Início e reinício de rodadas.
* Respostas individuais.
* Placar sincronizado em tempo real.
* Revelação das respostas.
* Encerramento da partida com placar final.

### 🏆 Rankings

O sistema possui rankings independentes para diferentes contextos:

* 🧍 **Ranking solo**
* 👥 **Ranking de campeonato**
* 📅 **Últimos 7 dias**
* 📅 **Últimos 30 dias**
* 📅 **Último ano**
* 🌎 **Ranking geral**

A janela de período utilizada na tabela é a mesma utilizada para calcular a posição individual do jogador.

Isso evita que o ranking e o indicador de posição utilizem períodos diferentes.

### 🔒 Privacidade

Cada jogador pode escolher se deseja aparecer no ranking solo de outros jogadores.

A configuração de privacidade afeta somente o ranking solo e não altera o funcionamento das partidas ou do campeonato.

### 👨‍💼 Painel administrativo

Administradores podem:

* criar usuários;
* gerar novos códigos de acesso;
* remover usuários;
* zerar pontuações;
* administrar as contas do sistema.

Não existe cadastro público.

Todas as contas são criadas e administradas pelo painel administrativo.

### 🔑 Credenciais temporárias

Cada novo usuário recebe uma credencial inicial de 4 dígitos.

Características:

* validade de **5 minutos**;
* uso para o primeiro acesso;
* troca de senha obrigatória;
* credencial armazenada de forma protegida;
* possibilidade de geração de um novo código pelo administrador.

### 📖 Versículo do dia

A tela inicial apresenta um versículo selecionado de acordo com o dia.

O mesmo versículo é exibido para todos os usuários naquele dia, sem necessidade de consulta ao servidor.

---

# 🎮 Modos de jogo

## 🧍 Solo

O jogador responde às perguntas individualmente.

```text
Entrar
  ↓
Selecionar perguntas
  ↓
Responder
  ↓
Verificar resultado
  ↓
Calcular pontuação
  ↓
Registrar partida
  ↓
Atualizar ranking
```

---

## 👥 Multiplayer

O criador abre uma sala e outros jogadores entram através do código ou convite.

```text
Criar sala
    ↓
Convidar jogadores
    ↓
Jogadores entram
    ↓
Anfitrião inicia
    ↓
Rodada começa
    ↓
Jogadores respondem
    ↓
Servidor valida
    ↓
Placar atualizado
    ↓
Fim da rodada
```

---

# 🔄 Fluxo do sistema

O fluxo principal da plataforma é dividido em quatro grandes etapas:

### 1. 🔐 Autenticação

O usuário entra utilizando suas credenciais e recebe uma sessão autenticada.

### 2. 📖 Rodada

O servidor disponibiliza as perguntas sem revelar diretamente o gabarito.

Cada rodada recebe um token próprio.

### 3. 🎯 Respostas

Cada resposta é enviada ao servidor, que verifica sua validade e retorna o resultado.

### 4. 🏆 Pontuação

Ao finalizar a rodada, o servidor calcula e registra a pontuação.

O cliente não é responsável por determinar a pontuação final.

---

# 👤 Usuários e permissões

O sistema possui uma administração centralizada de contas.

| Perfil              | Responsabilidade                                     |
| ------------------- | ---------------------------------------------------- |
| 👨‍💼 Administrador | Gerenciamento de usuários e administração do sistema |
| 👤 Jogador          | Participação nas partidas, histórico e rankings      |

O cadastro público está desabilitado.

As contas são criadas pelo administrador.

---

# 🧰 Stack tecnológica

## Frontend

| Tecnologia           | Utilização                |
| -------------------- | ------------------------- |
| **React 19**         | Interface da aplicação    |
| **React Router**     | Navegação                 |
| **Vite**             | Desenvolvimento e build   |
| **Tailwind CSS**     | Estilização               |
| **Socket.IO Client** | Comunicação em tempo real |
| **Axios**            | Comunicação com a API     |

## Backend

| Tecnologia    | Utilização                |
| ------------- | ------------------------- |
| **Node.js**   | Runtime                   |
| **Express**   | API HTTP                  |
| **Socket.IO** | Comunicação em tempo real |
| **Sequelize** | ORM                       |
| **SQLite**    | Banco de dados            |
| **JWT**       | Autenticação              |
| **bcryptjs**  | Hash de senhas            |
| **Helmet**    | Cabeçalhos de segurança   |

## Testes e CI

| Tecnologia            | Utilização                |
| --------------------- | ------------------------- |
| **node:test**         | Testes automatizados      |
| **Supertest**         | Testes de API             |
| **SQLite em memória** | Banco isolado para testes |
| **GitHub Actions**    | Integração contínua       |

---

# 🏗️ Arquitetura

O **Jeová Ensina** utiliza uma arquitetura separada entre cliente e servidor.

```text
🎮 JEOVÁ ENSINA
│
├── 🌐 Frontend
│   ├── React 19
│   ├── React Router
│   ├── Vite
│   ├── Tailwind CSS
│   ├── Socket.IO Client
│   └── Axios
│
├── ⚙️ Backend
│   ├── Node.js
│   ├── Express
│   ├── Socket.IO
│   ├── JWT
│   ├── bcryptjs
│   └── Helmet
│
├── 🗄️ Persistência
│   ├── Sequelize
│   └── SQLite
│
└── 🧪 Qualidade
    ├── node:test
    ├── Supertest
    └── GitHub Actions
```

### Responsabilidades

| Camada    | Responsabilidade                                           |
| --------- | ---------------------------------------------------------- |
| Frontend  | Interface, navegação, interação e apresentação dos dados   |
| Backend   | Regras de negócio, autenticação, validação e pontuação     |
| Socket.IO | Comunicação e sincronização das partidas                   |
| Banco     | Persistência de usuários, partidas, perguntas e pontuações |
| Testes    | Validação automatizada das regras e da segurança           |

---

# ⚙️ Instalação

## Requisitos

* **Node.js 18 ou superior**
* npm

Clone o projeto e instale as dependências:

```bash
npm run setup
```

O comando instala as dependências e popula o banco de perguntas.

Para iniciar frontend e API juntos:

```bash
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

A API será executada na porta:

```text
3002
```

---

## Desenvolvimento separado

Para executar API e frontend em terminais independentes:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

### Windows

Também é possível utilizar:

```text
scripts\iniciar.bat
```

O script instala o que estiver faltando, cria os arquivos `.env` a partir dos exemplos e abre as janelas necessárias.

Para encerrar:

```text
scripts\parar.bat
```

---

# 🚀 Primeiro acesso

O primeiro usuário criado é o administrador.

Execute:

```bash
npm run criar:admin
```

O comando exibirá:

* usuário;
* senha inicial.

A senha é exibida **uma única vez**.

> ⚠️ Guarde a senha antes de fechar o terminal.

A credencial inicial possui validade de **5 minutos** e precisa ser substituída no primeiro login.

Depois disso, o administrador pode utilizar o painel para criar os demais jogadores.

Cada jogador recebe um código inicial de 4 dígitos, também válido por 5 minutos.

### Reset do administrador

Caso seja necessário gerar novamente a credencial do administrador:

```bash
npm run criar:admin -- --reset
```

---

# 🌐 Variáveis de ambiente

Copie os arquivos de exemplo:

```text
server/.env.example → server/.env
client/.env.example → client/.env
```

O `.env` nunca deve ser versionado.

| Variável           | Local  | Padrão                   | Descrição                               |
| ------------------ | ------ | ------------------------ | --------------------------------------- |
| `PORT`             | server | `3002`                   | Porta da API                            |
| `NODE_ENV`         | server | `development`            | Ambiente de execução                    |
| `JWT_SECRET`       | server | —                        | Segredo obrigatório para JWT            |
| `JWT_EXPIRES_IN`   | server | `7d`                     | Validade do token                       |
| `EXIGIR_SEGREDO`   | server | `false`                  | Ativa exigência adicional do JWT secret |
| `TRUST_PROXY`      | server | `0`                      | Configuração de proxy reverso           |
| `CLIENT_URL`       | server | `http://localhost:5173`  | Origens autorizadas                     |
| `CORS_LAN`         | server | `true` em dev            | Permite origens da rede local           |
| `DATABASE_DIALECT` | server | `sqlite`                 | Dialeto do banco                        |
| `DATABASE_STORAGE` | server | `./data/database.sqlite` | Caminho do SQLite                       |
| `LIMITE_LOGIN`     | server | `20 / 15 min`            | Limite de login                         |
| `LIMITE_SENHA`     | server | `10 / 15 min`            | Limite de alterações de senha           |
| `LIMITE_ADMIN`     | server | `60 / 15 min`            | Limite de rotas administrativas         |
| `LIMITE_PONTUACAO` | server | `20 / min`               | Limite de envio de pontuação            |
| `LIMITE_VEREDITO`  | server | `120 / min`              | Limite de vereditos                     |
| `LIMITE_GERAL`     | server | `300 / min`              | Limite das demais rotas                 |
| `VITE_API_URL`     | client | `/api`                   | URL da API                              |
| `VITE_SOCKET_URL`  | client | mesma origem             | URL do Socket.IO                        |

### 🔑 Gerando um JWT_SECRET

Utilize:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Em produção, o sistema exige um segredo adequado e rejeita valores de exemplo ou segredos com menos de 32 caracteres.

---

# 📁 Estrutura do projeto

```text
.
├── client/
│   ├── public/
│   │   └── data/
│   │       └── perguntas.json
│   └── src/
│       ├── components/
│       ├── constants/
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       └── utils/
│
├── server/
│   ├── data/
│   ├── tests/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── realtime/
│       ├── routes/
│       ├── seeders/
│       └── utils/
│
├── scripts/
│   ├── iniciar.bat
│   └── parar.bat
│
└── docs/
    ├── sdd.md
    ├── layout.md
    └── script.md
```

---

# 🔌 API

A API utiliza `/api` como base.

As rotas protegidas exigem autenticação e determinadas rotas administrativas exigem perfil `admin`.

| Método   | Rota                             | Acesso   | Descrição                         |
| -------- | -------------------------------- | -------- | --------------------------------- |
| `POST`   | `/auth/login`                    | Público  | Login                             |
| `GET`    | `/auth/me`                       | Usuário  | Dados do usuário autenticado      |
| `PUT`    | `/auth/usuario`                  | Usuário  | Altera nome de usuário            |
| `POST`   | `/auth/change-password`          | Usuário  | Altera senha                      |
| `PUT`    | `/auth/ranking-visibilidade`     | Usuário  | Configura visibilidade no ranking |
| `GET`    | `/perguntas`                     | Usuário  | Obtém perguntas sem gabarito      |
| `GET`    | `/perguntas/categorias`          | Usuário  | Lista categorias                  |
| `GET`    | `/perguntas/:id`                 | Usuário  | Obtém uma pergunta                |
| `POST`   | `/perguntas/responder`           | Usuário  | Valida resposta                   |
| `GET`    | `/pontuacoes/ranking`            | Opcional | Consulta ranking                  |
| `GET`    | `/pontuacoes/eu`                 | Usuário  | Histórico do jogador              |
| `POST`   | `/pontuacoes`                    | Usuário  | Registra pontuação                |
| `GET`    | `/admin/usuarios`                | Admin    | Lista usuários                    |
| `POST`   | `/admin/usuarios`                | Admin    | Cria usuário                      |
| `POST`   | `/admin/usuarios/:id/codigo`     | Admin    | Gera novo código                  |
| `DELETE` | `/admin/usuarios/:id`            | Admin    | Remove usuário                    |
| `DELETE` | `/admin/usuarios/:id/pontuacoes` | Admin    | Zera pontuação                    |

---

# 🛡️ Proteção das rodadas

O sistema utiliza um fluxo baseado em token para impedir que o cliente descubra ou manipule o gabarito.

### 1. 📥 Obtenção das perguntas

```http
GET /perguntas
```

A resposta não contém `resposta_correta`.

O servidor também cria um token de rodada baseado em:

* ID do jogador;
* IDs das perguntas disponibilizadas;
* nonce aleatório;
* HMAC-SHA256.

### 2. 🎯 Verificação da resposta

```http
POST /perguntas/responder
```

O servidor verifica a resposta e retorna:

```text
correta
respostaCorreta
dificuldade
pontos
```

### 3. 🏆 Registro da partida

```http
POST /pontuacoes
```

A rodada é registrada e o token não pode ser reutilizado.

Uma tentativa de reutilização resulta em:

```text
409 Conflict
```

Esse fluxo impede que o cliente simplesmente envie uma partida perfeita fabricada.

---

# ⚡ Tempo real

As partidas multiplayer utilizam **Socket.IO** na mesma porta da API.

## Eventos do cliente

| Evento                     | Função                   |
| -------------------------- | ------------------------ |
| `sessao:criar`             | Cria uma sala            |
| `sessao:entrar`            | Entra em uma sala        |
| `sessao:consultar`         | Consulta sessão          |
| `sessao:sair`              | Sai da sala              |
| `sessao:convidar`          | Envia convite            |
| `sessao:responder_convite` | Aceita ou recusa convite |
| `sessao:listar`            | Lista jogadores          |
| `sessao:iniciar`           | Inicia partida           |
| `sessao:reiniciar`         | Reinicia rodada          |
| `partida:responder`        | Envia resposta           |
| `presenca:listar`          | Lista jogadores online   |

## Eventos do servidor

| Evento                | Função                  |
| --------------------- | ----------------------- |
| `convite:recebido`    | Novo convite            |
| `convite:resultado`   | Resultado do convite    |
| `convite:expirado`    | Convite expirado        |
| `sessao:adicionar`    | Jogador entrou          |
| `sessao:remover`      | Jogador saiu            |
| `sessao:removido`     | Jogador foi removido    |
| `sessao:aviso`        | Aviso da sessão         |
| `sessao:estado`       | Estado e placar         |
| `partida:pergunta`    | Nova pergunta           |
| `partida:revelacao`   | Revelação do gabarito   |
| `partida:fim`         | Final da partida        |
| `presenca:atualizada` | Atualização de presença |
| `ranking:atualizado`  | Ranking atualizado      |
| `erro`                | Erro de operação        |

### Regra de sessão

Cada usuário pode possuir somente **uma sessão ativa por vez**.

Criar uma nova sessão, entrar em outra ou aceitar um convite enquanto já existe uma sessão ativa é recusado.

---

# 🎯 Pontuação

A pontuação é determinada no servidor.

### Pontos por dificuldade

| Dificuldade | Pontos |
| ----------- | -----: |
| 🟢 Fácil    |     10 |
| 🟡 Médio    |     20 |
| 🔴 Difícil  |     30 |

### Bônus por sequência

| Acertos consecutivos | Bônus |
| -------------------: | ----: |
|                    3 |    +5 |
|                    5 |   +15 |

Um erro interrompe a sequência.

O cliente envia o **texto da alternativa escolhida**, e não o índice da opção.

Isso evita problemas causados pelo embaralhamento das alternativas.

Uma mesma pergunta também não pode gerar pontuação duplicada dentro da mesma partida.

---

# 🏆 Períodos do ranking

O parâmetro `periodo` aceita:

```text
tudo
7
30
365
```

Representando:

* `tudo` → período completo;
* `7` → últimos 7 dias;
* `30` → últimos 30 dias;
* `365` → últimos 365 dias.

Valores desconhecidos são tratados como `tudo`.

---

# 🧪 Testes

Execute:

```bash
npm test
```

O projeto possui **133 testes** utilizando:

* `node:test`;
* `supertest`;
* SQLite em memória.

Os testes de API não utilizam o banco de dados real da aplicação.

| Arquivo                   | Cobertura                                          |
| ------------------------- | -------------------------------------------------- |
| `tests/sessoes.test.js`   | Sessões, convites, partidas e permissões           |
| `tests/api.test.js`       | Rotas, login, ranking, histórico e administração   |
| `tests/seguranca.test.js` | Gabarito, tokens, HMAC, autenticação e rate limits |
| `tests/migracao.test.js`  | Migração e conversão de credenciais                |
| `tests/ambiente.test.js`  | Validação de `JWT_SECRET`                          |
| `tests/periodo.test.js`   | Filtros de período                                 |

Também são cobertos:

* pontuação;
* credenciais;
* normalização de texto;
* CORS;
* regras de autenticação;
* proteção contra reutilização de rodada.

A CI executa:

```text
Testes
  ↓
Lint
  ↓
Build
  ↓
Validações adicionais
```

A pipeline também verifica se arquivos `.env` foram acidentalmente versionados.

---

# 🔐 Segurança

A aplicação possui diversas camadas de proteção.

### 🔑 Senhas e credenciais

* Senhas protegidas com `bcrypt`.
* Códigos iniciais armazenados como HMAC-SHA256.
* Credenciais temporárias.
* Código inicial não é retornado pela API.
* Senhas não são retornadas pela API.

### 🛡️ Autenticação

* JWT.
* Algoritmo HS256 fixado.
* Token validado contra a conta existente.
* Contas removidas deixam de aceitar tokens anteriores.
* `JWT_SECRET` obrigatório.

### 🎯 Proteção de pontuação

* Gabarito não é enviado pela listagem de perguntas.
* Tokens de rodada assinados.
* Tokens associados ao jogador.
* Rodadas de uso único.
* Perguntas precisam pertencer à rodada.
* Pontuação recalculada no servidor.
* Perguntas duplicadas não geram pontuação duplicada.

### 🚦 Rate limiting

Existem limites específicos para:

* login;
* troca de senha;
* rotas administrativas;
* envio de pontuação;
* vereditos;
* demais endpoints.

O login também possui proteção por conta contra tentativas consecutivas.

### 🌐 CORS

O CORS utiliza uma lista de origens autorizadas.

A liberação da rede local fica restrita ao ambiente de desenvolvimento.

### 🪖 Headers

A aplicação utiliza **Helmet** para proteção dos cabeçalhos HTTP.

Rotas sensíveis de autenticação e health check utilizam:

```text
Cache-Control: no-store
```

### 👥 Socket.IO

Eventos possuem limites por socket.

A sala pública informa a presença do jogador sem expor o código privado da sessão.

---

# 📖 Base de perguntas

A fonte principal das perguntas está em:

```text
server/src/seeders/perguntas.json
```

O frontend possui uma cópia utilizada como fallback:

```text
client/public/data/perguntas.json
```

A cópia do client é gerada automaticamente.

> ⚠️ Não edite diretamente `client/public/data/perguntas.json`.

Edite a fonte no servidor e execute:

```bash
npm run seed
```

---

# 🛠️ Comandos disponíveis

| Comando               | Descrição                                     |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Inicia API e frontend                         |
| `npm run dev:api`     | Inicia somente a API                          |
| `npm run dev:web`     | Inicia somente o frontend                     |
| `npm run build`       | Gera build de produção                        |
| `npm test`            | Executa os testes                             |
| `npm run lint`        | Executa ESLint                                |
| `npm run seed`        | Popula o banco e atualiza perguntas do client |
| `npm run sync`        | Sincroniza o schema                           |
| `npm run criar:admin` | Cria o administrador                          |

---

# 📚 Documentação

Documentos complementares:

* [`docs/sdd.md`](docs/sdd.md) — decisões de arquitetura e requisitos;
* [`docs/layout.md`](docs/layout.md) — layout das telas;
* [`docs/script.md`](docs/script.md) — scripts e rotinas de manutenção.

---

# 📌 Princípios do projeto

O **Jeová Ensina** foi estruturado em torno de alguns princípios técnicos:

```text
📖 Conteúdo
    ↓
🎮 Experiência de jogo
    ↓
⚡ Tempo real
    ↓
🔐 Segurança
    ↓
🏆 Pontuação confiável
    ↓
📊 Histórico e ranking
```

A responsabilidade pela validação das informações importantes permanece no servidor, reduzindo a dependência da lógica executada no navegador.

---

# 🚀 Visão geral

```text
             🎮 JEOVÁ ENSINA
                    │
       ┌────────────┴────────────┐
       │                         │
   🧍 MODO SOLO             👥 MULTIPLAYER
       │                         │
       ├── Perguntas             ├── Salas
       ├── Pontuação             ├── Convites
       ├── Histórico             ├── Socket.IO
       └── Ranking               └── Placar em tempo real
                    │
                    ▼
              ⚙️ BACKEND
                    │
        ┌───────────┼───────────┐
        │           │           │
      🔐 JWT      🎯 Score    🛡️ Security
        │           │           │
        └───────────┼───────────┘
                    ▼
                🗄️ SQLite
```

---

# 📄 Licença

Este projeto está distribuído sob a licença **MIT**.

Consulte o arquivo [`LICENSE`](LICENSE) para obter os termos completos.

---

<div align="center">

### 📖 JEOVÁ ENSINA

**Pergunte. Aprenda. Jogue.**

🎮 · 📖 · 🏆 · ⚡ · 🔐

</div>
