# Script — Jeová Ensina

Documento de referência com toda a **lógica de funcionamento** do jogo: fluxos,
estados, regras, eventos e responsabilidades de cada parte do sistema.

> Este documento descreve **o que o código faz hoje**. Onde ele e o `README.md`
> divergir, o código ganha.
> Para especificações visuais, ver `layout.md`.

---

## 📌 Visão Geral

**Jeová Ensina** é um jogo de quiz bíblico web com dois modos:

1. **Modo Solo** — o jogador responde sozinho, com vidas limitadas, e o
   resultado vai para o ranking individual.
2. **Partida ao vivo** — várias pessoas entram numa sessão por código,
   respondem **a mesma pergunta ao mesmo tempo**, e o placar é atualizado para
   todos a cada resposta.

O **servidor é sempre a autoridade**: nunca confia no cliente para validar
respostas, calcular pontos ou decidir quem joga. Onde a regra tem duas partes
(uma no cliente para dar retorno imediato, outra no servidor para ser
verdade), a decisão que vale é sempre a do servidor.

### Vocabulário

O código fala em **sessão**, não em sala. Uma sessão é o conjunto de jogadores
que compartilham as mesmas perguntas, o mesmo cronômetro e o mesmo placar.

| Termo | Significado |
| ----- | ----------- |
| **sessão** | A sala de jogo, identificada por um código de 6 caracteres |
| **anfitrião** | Quem criou a sessão. Único autorizado a iniciar, reiniciar, convidar, adicionar e remover |
| **elenco** | A lista de jogadores da sessão. **Trava** quando a partida começa |
| **rodada** | Uma pergunta da sessão, com prazo e revelação |
| **persistir** | Gravar o resultado da sessão no banco, para aparecer no ranking |

---

## 🔐 Autenticação

### Como as contas existem

Não existe cadastro público. Todas as contas saem do painel administrativo ou
do comando `npm run criar:admin`. Quem não tem conta não entra.

1. O admin gera um **código de 4 dígitos** para o jogador
   (`POST /api/admin/usuarios/:id/codigo`).
2. Esse código vira a senha provisória e vale por **5 minutos**
   (`users.senha_expira_em`).
3. O jogador entra com `username` + o código. A resposta traz
   `must_change_password: true`, e o cliente manda para a troca de senha.
4. Na troca, a senha real substitui o código: `codigo` e `senha_expira_em` são
   zerados e a flag é limpa. O número sorteado nunca volta.

### Fluxo de login

1. Usuário sem token → tela de **Login**.
2. `POST /api/auth/login` com `{ username, password }`.
3. Sucesso → `{ token, user }`; o cliente guarda os dois no `localStorage`.
4. Toda requisição autenticada manda `Authorization: Bearer <token>`.
5. `401` → o cliente limpa o storage e volta para o Login.

### Regras

- `username` entre 3 e 50 caracteres, apenas `A-Z a-z 0-9 _ . -`, único.
- O login aceita **4 caracteres ou mais**, porque ali entra tanto o código de 4
  dígitos quanto uma senha definitiva. A regra forte (mínimo 8) vale na **troca**
  de senha, não no login.
- Senha guardada com hash bcrypt. O código inicial nunca é gravado em texto
  puro: entra pelo mesmo caminho e vira o hash da senha.
- **Expiração vence a senha certa.** Se `senha_expira_em` passou, o login é
  recusado com a mensagem de pedir um código novo ao admin — mesmo que a senha
  digitada esteja certa. Sem essa checagem, o "válido por 5 minutos" não valia
  nada.
- Token JWT: `{ id, username, role }`, validade de 7 dias
  (`JWT_EXPIRES_IN`).
- `username` e `role` viajam **dentro do token**. Por isso trocar o nome ou a
  senha **emite um token novo** na resposta, e o cliente substitui o antigo.
  Sem isso a presença em tempo real continuaria mostrando o nome velho por
  até 7 dias.
- A sessão persiste ao recarregar a página enquanto o token for válido.

### O que o jogador controla

- **Nome** — `PUT /api/auth/usuario`, para si mesmo.
- **Senha** — `POST /api/auth/change-password`, exigindo a senha atual.
- **Visibilidade no ranking solo** — `PUT /api/auth/ranking-visibilidade`. É uma
  escolha **por conta**, não controlada pelo admin, e **não afeta o
  campeonato**: lá a pontuação só tem sentido dentro da própria partida.

### O que o administrador controla

`GET /api/admin/usuarios`, `POST /api/admin/usuarios`,
`POST /api/admin/usuarios/:id/codigo` (novo código),
`DELETE /api/admin/usuarios/:id` e
`DELETE /api/admin/usuarios/:id/pontuacoes`. Apagar o usuário leva junto as
pontuações (`Pontuacao.user_id` com `onDelete: 'CASCADE'`).

### O que nunca sai da API

O `toJSON` do modelo `User` remove `password` **e** `codigo`. O código de 4
dígitos é metade da senha: devolvê-lo em qualquer resposta seria a mesma coisa que
devolver a senha.

---

## 🏠 Tela Inicial

- Saudação "Olá, [username]"
- Versículo do dia, sorteado pelo dia (todo mundo vê o mesmo, sem consultar o
  servidor)
- Cartão da partida em andamento, se houver, com o código para voltar
- Atalhos: **Novo jogo** (solo) e **Jogar com amigos** (partida ao vivo)
- Resumo pessoal: pontos totais, recorde e número de jogos (agregados no banco)

---

## 🎮 Modo Solo

### Fluxo

1. O jogador escolhe categoria, dificuldade, número de perguntas, tempo por
   pergunta e vidas.
2. `GET /api/perguntas?categoria=&dificuldade=&limite=`
3. O servidor sorteia **no banco** (`ORDER BY RANDOM()` antes do `LIMIT`) e
   embaralha as opções de cada uma, ajustando o índice da resposta correta.
4. Para cada pergunta: mostra as opções, o jogador escolhe uma, o cliente
   confere e dá o retorno na hora (verde/vermelho, explicação).
5. A cada resposta o cronômetro de 30s conta; ao zerar, a pergunta fecha e a
   partida conta como errada.
6. A partida acaba quando **todas as perguntas foram respondidas** ou quando as
   **vidas chegam a zero**.
7. Tela de resultado com placar, acertos, bônus e o maior combo.
8. `POST /api/pontuacoes` grava no histórico e devolve o resumo oficial.

### Regras

- **Vidas iniciais: 3.** Cada erro consome uma. Zerar as vidas encerra na hora.
- Tempo por pergunta: 30s por padrão. `0` desliga o cronômetro.
- O placar exibido antes do envio é uma prévia calculada no cliente. O valor
  que vale é o que o servidor devolve no `resumo`.

### Por que o cliente manda o texto, não o índice

As opções são embaralhadas a cada partida, então o índice que o jogador clicou
não corresponde ao índice guardado no banco. O cliente envia o **texto** da
opção escolhida e o servidor compara com o texto da opção correta original
(`normalizar` ignora maiúsculas, acentos e espaços extras). Assim o servidor
continua sendo a fonte da verdade sem depender da ordem aleatória.

Cada pergunta vale **uma vez só**: `perguntaId` repetido é ignorado, e a ordem
da primeira ocorrência é preservada (o combo depende dela). Sem essa
deduplicação, bastava repetir a resposta certa 50 vezes para aparecer no topo.

---

## 🎯 Pontuação

| Acertos seguidos | Bônus |
| ---------------- | ----- |
| 3 | +5 |
| 5 | +15 |

| Dificuldade | Pontos por acerto |
| ------------ | ----------------- |
| Fácil | 10 |
| Médio | 20 |
| Difícil | 30 |

O erro zera a sequência. Os bônus não se acumulam entre si: ao chegar em 5
seguidos, o total recebe +15 (o de 3 já foi pago no terceiro acerto).

`calcularPontuacao` é a **única** função que transforma respostas em pontos. Ela
é usada tanto pelo modo solo (no `POST /api/pontuacoes`) quanto pela partida ao
vivo (no servidor, a cada `partida:responder` e de novo ao persistir).

---

## 🕹️ Partida ao vivo

### Sessão

- Código de **6 caracteres** do alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
  (sem `I`, `O`, `0` e `1`, para não confundir na fala).
- Criada por `sessao:criar`. Quem cria é o **anfitrião**.
- Uma sessão por pessoa: criar, entrar ou aceitar convite é recusado enquanto a
  anterior estiver de pé. Sessão **encerrada** não bloqueia — ela já cumpriu o
  papel e pode ser abandonada.
- Tudo em memória (`Map`). Se a última aba de todos os jogadores cair, a sessão
  é destruída.

### Configuração

| Campo | Padrão | Limite |
| ----- | ------ | ------ |
| `total` | 10 | 1 a 30 |
| `categoria` | `todas` | — |
| `dificuldade` | `todas` | — |
| `tempoPorQuestao` | 30s | 5 a 120s |

Fora desses limites, o valor é **ajustado** em vez de rejeitado. Na sessão ao
vivo o cronômetro nunca é desligável: sem prazo, uma partida travada nunca
terminaria.

### Ciclo de vida

```
aguardando ──iniciar──▶ jogando ──última pergunta──▶ encerrada
     ▲                      │                          │
     └────────reiniciar─────┴────(só pelo anfitrião)───┘
```

- **`aguardando`** — o elenco pode mudar. Entrar por código, ser convidado,
  adicionado ou removido.
- **`jogando`** — **elenco travado**. Quem não está, não entra. O único caminho
  de volta é `reiniciar`, e só o anfitrião pode.
- **`encerrada`** — o resultado foi (ou não) gravado. Convidar ou adicionar
  alguém reinicia automaticamente.

### Fase 1 — Montagem

1. O anfitrião escolhe a configuração e abre a sessão.
2. Convida quem quiser. O convidado recebe `convite:recebido` e responde.
   **Só entra no elenco quem aceita.**
3. O convite expira em **90 segundos** se não houver resposta. Um convite que
   nunca é respondido tranca o anfitrião esperando confirmação.
4. O anfitrião vê a lista de pendentes e só então inicia.

### Fase 2 — Início

`sessao:iniciar` (somente anfitrião):

1. Carrega as perguntas do filtro e **sorteia uma vez só**. Todos da sessão veem
   as mesmas perguntas, na mesma ordem, com as opções na mesma ordem.
2. Zera pontos, acertos, combos e respostas de todos.
3. Define `modo`: **`solo` com uma pessoa, `campeonato` com duas ou mais**. O
   modo nasce aqui e **não muda mais** — uma partida solo não vira campeonato no
   meio, e o resultado vai para uma lista só.
4. Emite `partida:pergunta` com a primeira pergunta, o prazo e o placar zerado.

### Fase 3 — Rodada

**Não há turnos.** Todos respondem a mesma pergunta ao mesmo tempo, cada um no
seu navegador.

1. `partida:pergunta` traz a pergunta, o índice, o total, o prazo e o placar.
   O gabarito **não** vai nessa mensagem.
2. Cada jogador responde com `partida:responder`, mandando o **texto** da opção
   escolhida.
3. O servidor confere o texto contra a resposta correta, recalcula os pontos
   daquele jogador e emite `ranking:atualizado` para a sala toda.
4. A rodada fecha em duas situações:
   - **todos responderam**, ou
   - **o cronômetro zerou**.
5. `partida:revelacao` mostra o gabarito e o placar por **2,5 segundos**.
6. Depois, a próxima pergunta. Ao passar da última, `partida:fim`.

#### Uma resposta por pergunta

Cada jogador tem `respondeuIndice`. O flag `respondeu` sozinho **não segura**:
a janela de revelação o zera, e nesse intervalo a mesma pergunta aceitaria novas
respostas, empilhando entradas e inflando a pontuação gravada. `respondeuIndice`
é a guarda autoritativa, e `reiniciar` devolve o valor para `-1`.

#### Cair e voltar

Se a conexão cai no meio da partida, o **slot é preservado** — o elenco está
travado, e tirar a pessoa deixaria a partida sem um participante e sem forma
de recuperar. O que muda é o jogo dela:

- o jogador vira `abandonou` e a sala recebe `sessao:aviso`;
- se reconectar, volta a valer (`marcarAbandono(..., false)`) e recebe
  `sessao:estado` com o estado exato da partida;
- o resultado só é gravado se ele **atravessar a sessão inteira**.

### Fase 4 — Encerramento e gravação

`encerrar` marca `encerrada`, para os timers e emite `partida:fim` **sem esperar
o banco** — o evento não pode ficar pendurado por causa de uma escrita. A
gravação corre em paralelo, e uma falha nela é registrada, não derruba o
processo.

Só entra no histórico quem cumpriu a sessão inteira:

| Condição | Por quê |
| -------- | ------- |
| A partida chegou à última pergunta | Uma sessão abandonada no meio não é resultado |
| O jogador respondeu **exatamente** todas as perguntas | Um total maior indicaria bug, não pontuação válida |
| O jogador não foi marcado como `abandonou` | Quem caiu e não voltou não disputa |

A gravação é `bulkCreate` e é idempotente por sessão (`persistida`), então uma
retransmissão não duplica a linha.

O **modo gravado é o do início da sessão**, então a partida aparece no ranking
Solo ou no Campeonato, nunca nos dois.

### Permissões

| Ação | Quem pode |
| ---- | --------- |
| Iniciar / reiniciar | Só o anfitrião |
| Convidar / adicionar / remover | Só o anfitrião |
| Sair da sessão | Qualquer jogador |
| Responder | Quem está no elenco |

O anfitrião não pode remover a si mesmo (usa "Sair da sessão"); se sair, a
anfitrião passa para o primeiro jogador da lista.

---

## 🏆 Ranking e histórico

### Dois rankings, não um

**Solo** e **Campeonato** são listas separadas. No campeonato a pontuação só
existe como disputa entre quem jogou junto; juntar os dois numa tabela traria
números sem comparação possível.

No solo, quem marcou a lista como privada some das listas dos outros e continua
aparecendo para si mesmo.

### Filtro de período

`tudo` (padrão), `7`, `30` ou `365` **dias**. São janelas deslizantes, não
"dia N do mês" — "30 dias" precisa continuar significando os últimos 30 dias
amanhã também. Valor desconhecido cai em `tudo` em vez de dar erro.

A mesma janela vale para a tabela, para o detalhe da melhor partida e para o
quadro "sua posição" do jogador, então os dois nunca contam partidas
diferentes. O filtro mora em `utils/periodo.js` e é compartilhado pelo ranking
e pelo histórico — foi justamente essa duplicação, antes, que fazia a posição
no ranking e os números do perfil divergirem.

### Consultas

O **histórico é paginado** (`pagina`, `porPagina` — padrão 10, teto 50) e o
bloco `resumo` é sempre agregado **no banco**, sobre o período inteiro. Somar as
linhas da página daria um número que muda conforme a navegação; carregar todas
as partidas para somar em JavaScript daria um custo que cresce sem limite. A
taxa de acertos do perfil vem do agregado do histórico completo.

O ranking é montado com **uma** consulta ordenada e redução em JavaScript. A
versão anterior fazia uma consulta por linha da tabela; trocada por uma única
varredura com agregação no banco.

---

## 🔌 Eventos de tempo real

Toda requisição de socket é autenticada por JWT no handshake. Falhou, a conexão
não abre.

### Cliente → servidor

| Evento | O que faz |
| ------ | --------- |
| `sessao:criar` | Abre a sessão com a configuração escolhida |
| `sessao:entrar` | Entra pelo código |
| `sessao:consultar` | Recupera a sessão atual (usado ao reconectar a tela) |
| `sessao:sair` | Sai do elenco e da sala |
| `sessao:convidar` | Manda convite (expira em 90s) |
| `sessao:responder_convite` | Aceita ou recusa |
| `sessao:listar` | Minha sessão + quem está online |
| `sessao:adicionar` | Coloca alguém no elenco sem convite |
| `sessao:remover` | Tira alguém do elenco |
| `sessao:reiniciar` | Zera e volta para `aguardando` |
| `sessao:iniciar` | Trava o elenco e começa |
| `partida:responder` | Envia o texto da opção escolhida |
| `presenca:listar` | Quem está online |

### Servidor → cliente

| Evento | Quando |
| ------ | ------ |
| `sessao:estado` | Estado completo: sessão, pergunta atual, placar, convites pendentes |
| `partida:pergunta` | Nova rodada, com índice, total e prazo |
| `partida:revelacao` | Gabarito revelado (2,5s) |
| `partida:fim` | Placar final, total e modo |
| `ranking:atualizado` | Alguém respondeu |
| `convite:recebido` | Convite para a sessão de alguém |
| `convite:resultado` | Alguém aceitou ou recusou |
| `convite:expirado` | Convite não respondido a tempo |
| `sessao:removido` | Você foi removido (a tela é limpa) |
| `sessao:aviso` | Aviso sobre a sessão (ex.: alguém ficou offline) |
| `presenca:atualizada` | A lista de online mudou |
| `erro` | Falha na operação |

Os eventos `partida:pergunta` e `partida:revelacao` **não** carregam o gabarito
antes da hora. A pergunta vai sem `resposta_correta`, e a revelação traz a
opção correta.

### Handlers e erros

Todo handler responde por *acknowledgement* com `{ ok: true, ... }` ou
`{ ok: false, erro, codigo }`, e o erro também vai como `erro`. Nenhuma falha
vira promessa rejeitada sem resposta — o cliente ficaria esperando.

### Presença

Cada usuário pode ter **várias abas** abertas. A presença só é removida quando
a **última** aba cai; o restante continua recebendo os eventos. Quem tem mais de
uma aba continua online, e o estado da sessão chega em todas elas.

Ao sair de uma sessão, o socket sai da sala **antes** de publicar o estado.
Sem isso, quem acabou de sair receberia o estado da sessão que acabou de
deixar.

---

## 📣 Avisos na tela

O servidor avisa coisas que o jogador precisa saber — alguém ficou offline, o
convite expirou, alguém recusou. Esses avisos chegam em `sessao:aviso`,
`convite:resultado` e `convite:expirado`, ficam guardados no contexto e
aparecem numa faixa no topo do conteúdo, em todas as telas.

A faixa **some sozinha** depois de alguns segundos e pode ser fechada à mão.
Fica no layout (e não dentro de cada tela) porque o aviso é global: a sessão
continua valendo mesmo com o jogador em outra parte do app.

---

## 🧱 Divisão de responsabilidades

| Camada | Decide |
| ------ | ------ |
| Cliente | Como a tela se comporta, retorno visual imediato, estado de navegação |
| Servidor | Quem entra, quem responde o quê, quanto vale cada ponto, o que vai para o ranking |

O cliente calcula pontos para dar retorno na hora, mas quem grava é o
servidor, recalculando tudo. A sessão ao vivo é inteira do servidor: o cliente
só desenha o que recebe.

---

## 🔐 Segurança embutida nas regras

- **Convite é obrigatório para ser convidado.** Responder um convite exige que
  exista um convite *pendente* para aquele jogador. Sem a checagem, qualquer
  pessoa autenticada que conhecesse o código da sessão — e ele aparece na
  presença — poderia "se aceitar sozinho" e entrar no meio da partida.
- **O elenco trava no início.** Depois disso, só entra quem já estava.
- **Senha e código não voltam** em nenhuma resposta.
- **O gabarito não é enviado** antes da revelação, na partida ao vivo.
- **`ranking_publico` é do jogador**, e nunca afeta o campeonato.
- **Limites por IP** em login, troca de senha e nome, rotas administrativas,
  envio de pontuação e no resto da API. Atrás de proxy reverso, `TRUST_PROXY`
  precisa estar ligado — sem ele todo mundo cai no mesmo contador e uma pessoa
  só trava o acesso de todos.
