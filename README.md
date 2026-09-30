# Jeová Ensina

Jogo de perguntas bíblicas para grupos. Funciona sozinho ou em partidas ao
vivo, com código de 4 dígitos, onde as pessoas entram pelo navegador e
respondem juntas.

## Funcionalidades

- **Modo solo** — treina e aparece no ranking.
- **Partidas em tempo real** — o criador abre a sala, convida por link, cada
  jogador responde por conta própria e o placar atualiza para todos.
- **Ranking solo e campeonato** — listas separadas, porque a pontuação de uma
  partida só vale na comparação com quem jogou junto.
- **Ranking por período** — 7 dias, 30 dias, 1 ano ou geral. A mesma janela vale
  para a tabela e para o quadro "sua posição", então os dois nunca contam
  partidas diferentes.
- **Ranking privado** — cada jogador escolhe se aparece na lista solo dos
  outros. O campeonato não é afetado.
- **Painel administrativo** — criar usuários, gerar novo código e zerar
  pontuação.
- **Credencial inicial de 4 dígitos** com validade de 5 minutos e troca de
  senha obrigatória no primeiro acesso.
- **Versículo do dia** na tela inicial, sorteado pelo dia (todo mundo vê o
  mesmo, sem consulta ao servidor).

## Stack

| Camada  | Tecnologias |
| ------- | ----------- |
| Frontend | React 19, React Router, Vite, Tailwind CSS, Socket.IO Client, Axios |
| Backend  | Node.js, Express, Socket.IO, Sequelize, SQLite, JWT, bcryptjs, Helmet |
| Testes   | `node:test` + `supertest` (banco SQLite em memória, sem tocar no seu) |
| CI       | GitHub Actions |

## Como rodar

Requisitos: **Node.js 18 ou superior**.

```bash
npm run setup    # instala as dependências e popula o banco de perguntas
npm run dev      # sobe a API (:3002) e o frontend (:5173) juntos
```

O frontend fica em <http://localhost:5173>.

Para gerar as janelas separadas (API e web) em terminais distintos:

```bash
npm run dev:api
npm run dev:web
```

No Windows, dá para usar `scripts\iniciar.bat`, que instala o que estiver
faltando, cria os `.env` a partir dos exemplos e abre as duas janelas.
`scripts\parar.bat` encerra tudo.

## Primeiro acesso

O primeiro usuário é o administrador:

```bash
npm run criar:admin
```

O comando imprime o usuário e uma senha inicial, mostrada **uma única vez** —
guarde antes de fechar o terminal. Ela vale por 5 minutos e precisa ser trocada
no primeiro login. Depois, use o painel administrativo para criar os demais
jogadores (cada um recebe um código de 4 dígitos, também com validade de 5
minutos).

Não existe cadastro público: todas as contas saem do painel do admin.

O `scripts\iniciar.bat` já executa esse passo. Se for a primeira vez na máquina,
ele cria a conta, mostra a senha e espera você anotar antes de continuar.

> Esqueceu a senha do admin? `npm run criar:admin -- --reset` gera outra.

## Variáveis de ambiente

Copie os exemplos e ajuste o que precisar:

- `server/.env` a partir de `server/.env.example`
- `client/.env` a partir de `client/.env.example`

O `.env` nunca é versionado — só os `.env.example` entram no repositório.

| Variável | Onde | Padrão | Para que serve |
| -------- | ---- | ------ | -------------- |
| `PORT` | server | `3002` | Porta da API |
| `NODE_ENV` | server | `development` | Em `production`, o CORS deixa de aceitar rede local |
| `JWT_SECRET` | server | — | **Obrigatório.** O servidor recusa a subir sem ele; em `production` também recusa o valor de exemplo do `.env.example` e segredos com menos de 32 caracteres |
| `JWT_EXPIRES_IN` | server | `7d` | Validade do token |
| `EXIGIR_SEGREDO` | server | `false` | Sobe a exigência de `JWT_SECRET` (tamanho mínimo) sem fingir que é produção. Útil em CI |
| `TRUST_PROXY` | server | `0` | **Use `1` atrás de proxy reverso.** Os limiters contam por IP; sem isto uma pessoa só trava o acesso de todos |
| `CLIENT_URL` | server | `http://localhost:5173` | Origens autorizadas, separadas por vírgula. Aceita `*` como curinga |
| `CORS_LAN` | server | `true` em dev | Libera origens da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x, `.local`) |
| `DATABASE_DIALECT` | server | `sqlite` | `sqlite` ou `postgres` |
| `DATABASE_STORAGE` | server | `./data/database.sqlite` | Caminho do arquivo SQLite |
| `LIMITE_LOGIN` | server | `20` / 15 min | Tentativas de login por IP |
| `LIMITE_SENHA` | server | `10` / 15 min | Trocas de senha e de nome |
| `LIMITE_ADMIN` | server | `60` / 15 min | Rotas administrativas |
| `LIMITE_PONTUACAO` | server | `20` / min | Envios de pontuação |
| `LIMITE_GERAL` | server | `300` / min | Demais rotas |
| `VITE_API_URL` | client | `/api` | Se a API ficar em outro host, use a URL completa |
| `VITE_SOCKET_URL` | client | mesma origem | Se o Socket.IO ficar em outro host |

Para gerar um `JWT_SECRET` de verdade:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Para jogar pela rede local, o `NODE_ENV` precisa ser `development` (ou
`CORS_LAN=true`) e o `CLIENT_URL` deve apontar para o IP da máquina que roda a
API, por exemplo `http://192.168.0.14:5173`.

## Estrutura

```
.
├── client/                  # frontend React (Vite)
│   ├── public/data/         # cópia das perguntas para o fallback offline
│   └── src/
│       ├── components/      # componentes de tela e de UI
│       ├── constants/       # dados fixos de navegação
│       ├── contexts/        # estado global (autenticação, partida)
│       ├── pages/           # uma pasta por tela
│       ├── services/        # chamadas de API (api, perguntas, ranking, pontuacoes)
│       └── utils/           # funções auxiliares
├── server/                  # API Express + Socket.IO
│   ├── data/                # banco SQLite (local, ignorado pelo git)
│   ├── tests/               # testes com node:test (unitários e de API)
│   └── src/
│       ├── config/          # banco, origens, validação de ambiente
│       ├── controllers/     # regras de cada rota
│       ├── middlewares/     # autenticação, rate limit
│       ├── models/          # modelos Sequelize
│       ├── realtime/        # eventos de socket e sessões
│       ├── routes/          # definição de rotas
│       ├── seeders/         # carga inicial e manutenção
│       └── utils/           # pontuação, período, credenciais, texto
├── scripts/                 # iniciar.bat e parar.bat
└── docs/                    # sdd.md, layout.md, script.md
```

## Comandos

| Comando | O que faz |
| ------- | --------- |
| `npm run dev` | API e frontend juntos |
| `npm run dev:api` / `npm run dev:web` | Sobe um lado por vez |
| `npm run build` | Build de produção do frontend |
| `npm test` | Roda os testes do servidor |
| `npm run lint` | ESLint no client **e** no server |
| `npm run seed` | Popula o banco e reexporta as perguntas para o client |
| `npm run sync` | Sincroniza o schema do banco |
| `npm run criar:admin` | Cria o primeiro administrador |

## Base de perguntas

A fonte única é `server/src/seeders/perguntas.json`. O client mantém uma cópia
em `client/public/data/perguntas.json` usada como fallback quando a API está
inacessível, e ela é gerada pelo script — **não edite a cópia do client
diretamente**, edite a do servidor e rode `npm run seed`.

## API

Base: `/api`. As rotas marcadas exigem token; as de sessão também exigem perfil
`admin`.

| Método | Rota | Sessão | O que faz |
| ------ | ---- | ------ | --------- |
| `POST` | `/auth/login` | — | Entra com usuário e senha, ou com o código inicial |
| `GET` | `/auth/me` | usuário | Dados do jogador logado |
| `PUT` | `/auth/usuario` | usuário | Troca o próprio nome de usuário (devolve token novo) |
| `POST` | `/auth/change-password` | usuário | Troca a senha |
| `PUT` | `/auth/ranking-visibilidade` | usuário | Define se aparece no ranking solo |
| `GET` | `/perguntas` | — | Lista por categoria, dificuldade e limite |
| `GET` | `/perguntas/categorias` | — | Categorias disponíveis |
| `GET` | `/perguntas/:id` | — | Uma pergunta |
| `GET` | `/pontuacoes/ranking` | opcional | Ranking solo ou campeonato, por `modo` e `periodo` |
| `GET` | `/pontuacoes/eu` | usuário | Histórico do jogador, paginado, por `modo` e `periodo` |
| `POST` | `/pontuacoes` | usuário | Envia respostas e recebe a pontuação |
| `GET` | `/admin/usuarios` | admin | Lista usuários |
| `POST` | `/admin/usuarios` | admin | Cria usuário |
| `POST` | `/admin/usuarios/:id/codigo` | admin | Gera novo código inicial |
| `DELETE` | `/admin/usuarios/:id` | admin | Remove usuário |
| `DELETE` | `/admin/usuarios/:id/pontuacoes` | admin | Zera a pontuação |

`periodo` aceita `tudo` (padrão), `7`, `30` ou `365` — dias de janela
deslizante. Valor desconhecido cai em `tudo` em vez de dar erro.

O `GET /pontuacoes/eu` também aceita `pagina` e `porPagina` (padrão 10, teto
50) e devolve `paginacao: { pagina, porPagina, total, temMais }`. O bloco
`resumo` é sempre agregado **no banco**, sobre o período inteiro — nunca soma
as linhas da página.

### Tempo real

Socket.IO na mesma porta da API.

| Evento | Direção | O que faz |
| ------ | ------- | --------- |
| `sessao:criar` | cliente → servidor | Abre a sala e devolve o código |
| `sessao:entrar` | cliente → servidor | Entra na sala com o código |
| `sessao:consultar` | cliente → servidor | Recupera a sessão atual |
| `sessao:sair` | cliente → servidor | Sai da sala e libera a sessão |
| `sessao:convidar` | cliente → servidor | Manda convite (expira em 90s) |
| `sessao:responder_convite` | cliente → servidor | Aceita ou recusa |
| `sessao:listar` | cliente → servidor | Jogadores da sala |
| `sessao:iniciar` | cliente → servidor | Inicia a rodada (trava o elenco) |
| `sessao:reiniciar` | cliente → servidor | Nova rodada, zerando as respostas |
| `partida:responder` | cliente → servidor | Envia a resposta da pergunta atual |
| `presenca:listar` | cliente → servidor | Quem está online |
| `convite:recebido` | servidor → cliente | Convite para a sessão de alguém |
| `convite:resultado` | servidor → cliente | Alguém aceitou ou recusou |
| `convite:expirado` | servidor → cliente | Convite não respondido a tempo |
| `sessao:adicionar` | servidor → cliente | Entrou um jogador |
| `sessao:remover` | servidor → cliente | Saiu ou foi removido |
| `sessao:removido` | servidor → cliente | Você foi removido (limpa a tela) |
| `sessao:aviso` | servidor → cliente | Aviso da sessão (ex.: alguém ficou offline) |
| `sessao:estado` | servidor → cliente | Placar e estado da partida |
| `partida:pergunta` | servidor → cliente | Nova pergunta com prazo |
| `partida:revelacao` | servidor → cliente | Gabarito revelado |
| `partida:fim` | servidor → cliente | Fim da rodada, com placar final |
| `presenca:atualizada` | servidor → cliente | Lista de online mudou |
| `ranking:atualizado` | servidor → cliente | Placar do campeonato mudou |
| `erro` | servidor → cliente | Falha na operação |

Só pode existir **uma sessão ativa por usuário**. Criar, entrar ou aceitar um
convite é recusado enquanto a anterior estiver de pé.

## Pontuação

| Acertos seguidos | Bônus |
| ---------------- | ----- |
| 3 | +5 |
| 5 | +15 |

O erro zera a sequência. Um acerto vale 10 (fácil), 20 (médio) ou 30
(difícil).

**A pontuação é recalculada no servidor.** O cliente manda o **texto** da opção
escolhida (e não o índice, que muda a cada embaralhamento) e o servidor
confere contra a resposta correta original. Repetir a mesma pergunta no payload
não soma duas vezes.

## Testes

```bash
npm test
```

104 testes com `node:test`, sem tocar no seu banco: os testes de API sobem o
Express contra um SQLite em memória e limpam as tabelas a cada caso.

| Arquivo | Cobre |
| ------- | ----- |
| `tests/sessoes.test.js` | Regras de sessão: convite válido, convite não reaproveitável, entrada em partida já iniciada, resposta única por pergunta, permissões de anfitrião |
| `tests/api.test.js` | Rotas reais: login com código de 4 dígitos e expirado, `/me`, dedup de pontuação, totais do histórico, paginação, ranking, privacidade, `admin` |
| `tests/ambiente.test.js` | `JWT_SECRET` ausente, de exemplo ou curto demais |
| `tests/periodo.test.js` | Janelas do filtro de período |

Cobrem também pontuação, credenciais, normalização de texto e as regras de
CORS. A CI roda os testes, o lint, o build e ainda falha se um `.env` for
versionado.

## Segurança

- Senhas com hash bcrypt; o código inicial nunca é salvo em texto puro.
- O `JWT_SECRET` é validado no boot: sem ele o servidor não sobe, e em produção
  ele recusa o valor de exemplo do `.env.example` ou segredos curtos demais.
- A pontuação é recalculada no servidor a partir do texto enviado, e cada
  pergunta vale uma vez só por partida.
- Rate limit por IP em login, troca de senha, rotas de admin, envio de
  pontuação e no resto da API — tetos ajustáveis por ambiente.
- Helmet para os cabeçalhos de segurança; `Cache-Control: no-store` nas rotas
  de autenticação e no health check.
- CORS por lista de origens, com a rede local liberada só em desenvolvimento.
- Nem a senha nem o código de 4 dígitos saem da API em nenhuma resposta: os
  dois são removidos no `toJSON` do modelo.
- Convite só vale para quem realmente tem um convite pendente, e o elenco trava
  quando a rodada começa.

## Documentação

- [`docs/sdd.md`](docs/sdd.md) — decisões de arquitetura e requisitos
- [`docs/layout.md`](docs/layout.md) — layout das telas
- [`docs/script.md`](docs/script.md) — scripts e rotinas de manutenção

## Licença

[MIT](LICENSE)
