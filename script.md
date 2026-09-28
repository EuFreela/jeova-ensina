# Script — Jeová Ensina

Documento de referência com toda a **lógica de funcionamento** do jogo: fluxos, estados, regras, eventos e responsabilidades de cada parte do sistema.

> Para especificações visuais, ver `layout.md`.
> Para arquitetura técnica e stack, ver `SDD.md`.

---

## 📌 Visão Geral

**Jeová Ensina** é um jogo de quiz bíblico web com dois modos:

1. **Modo Solo** — jogador logado responde perguntas sozinho, acumulando pontos
2. **Modo Multiplayer ("Jogar com Amigos")** — vários jogadores entram numa sala por código e se revezam respondendo

O **servidor é sempre a autoridade**: nunca confia no cliente pra validar respostas, calcular pontos ou decidir turnos.

---

## 🔐 Autenticação

### Fluxo de Login/Cadastro

1. Usuário acessa o jogo sem token → redirecionado pra tela de **Login**
2. Pode escolher entre **Entrar** ou **Criar Conta**
3. Ao autenticar com sucesso:
   - Servidor retorna `{ token, user }`
   - Cliente salva `token` e `user` no `localStorage`
   - Redireciona pro **Menu Principal**
4. Toda requisição autenticada envia `Authorization: Bearer <token>`
5. Se o token expirar (401), cliente limpa o storage e volta pro Login

### Regras

- `username` único, 3–50 caracteres, sem espaços
- Senha mínimo 6 caracteres, armazenada com hash bcrypt (nunca em texto puro)
- Token JWT com expiração de 7 dias
- Sessão persiste ao recarregar a página (enquanto token for válido)

---

## 🏠 Menu Principal

Após login, o jogador vê:

- Saudação: "Olá, [username]"
- Pontuação máxima pessoal (se houver)
- Botão **Novo Jogo** → modo solo
- Botão **Jogar com Amigos** → modo multiplayer
- Botão **Ranking** → top 10 global
- Botão **Sair** → logout

---

## 🎮 Modo Solo

### Fluxo

1. Jogador clica em **Novo Jogo**
2. Cliente requisita `GET /api/perguntas?limite=10`
3. Servidor retorna 10 perguntas aleatórias com opções embaralhadas
4. Para cada pergunta:
   - Mostra pergunta + 4 opções
   - Jogador escolhe uma
   - Servidor (ou cliente, no caso solo) valida
   - Feedback visual: verde (acerto) / vermelho (erro)
   - Após 1.5s, avança pra próxima
5. Ao terminar as 10 perguntas:
   - Calcula pontuação total
   - Envia `POST /api/pontuacoes` com o resultado
   - Exibe **Tela de Resultado**
6. Botões disponíveis: **Jogar Novamente** e **Voltar ao Menu**

### Regras de Vidas (modo solo)

- Jogador começa com **3 vidas** (corações)
- Cada erro subtrai 1 vida
- Se vidas chegam a 0: **fim de jogo imediato** (mesmo com perguntas restantes)

### Regras de Pontuação (modo solo)

| Evento | Pontos |
|--------|--------|
| Acerto fácil | +10 |
| Acerto médio | +20 |
| Acerto difícil | +30 |
| Combo 3+ acertos seguidos | +5 por acerto extra |
| Combo 5+ acertos seguidos | +15 por acerto extra |
| Erro | 0 |

---

## 🌐 Modo Multiplayer

### Visão Geral

Jogadores logados entram numa **sala** por código de 6 caracteres. Cada rodada, **um jogador é o da vez** (ordem embaralhada). Todos veem a pergunta, mas só o jogador da vez pode responder. Após responder, todos veem o resultado.

### Fluxo Completo

#### Fase 1: Lobby

1. Jogador clica em **Jogar com Amigos**
2. Escolhe entre:
   - **Criar Sala** → servidor gera código de 6 caracteres (ex: `ABC123`)
   - **Entrar em Sala** → digita código existente
3. Ao entrar:
   - Servidor adiciona o jogador na sala (Map em memória)
   - Emite `jogador_entrou` pra todos da sala
   - Cliente mostra: código da sala, lista de jogadores, botão "Iniciar Jogo" (só host)
4. **Regras de sala:**
   - Mínimo 2 jogadores, máximo 6
   - Só o host (quem criou) pode iniciar
   - Host pode iniciar quando há 2+ jogadores

#### Fase 2: Início da Partida

1. Host clica em **Iniciar Jogo**
2. Servidor:
   - Embaralha a ordem dos jogadores → `ordem_turnos`
   - Sorteia 10 perguntas aleatórias
   - Zera pontos e combos de todos
   - Marca status da sala como `em_jogo`
3. Emite `partida_iniciada` pra todos com:
   - Ordem dos jogadores
   - Total de rodadas (10)
4. Define `indice_turno_atual = 0` (primeiro da fila)

#### Fase 3: Rodada / Turno

Para cada uma das 10 rodadas:

1. Servidor identifica o **jogador da vez** (`ordem_turnos[indice_turno_atual]`)
2. Emite `nova_pergunta` pra TODOS com:
   - Texto da pergunta
   - 4 opções
   - ID e nome do jogador da vez
   - Número da rodada (ex: "3/10")
3. **Cliente (todos os jogadores):**
   - Vê a mesma tela
   - Banner no topo: "Vez de: [Nome]"
   - Se for **sua vez**: botões ativos, cursor pointer
   - Se **não for sua vez**: botões com `opacity-50`, `cursor-not-allowed`, `pointer-events-none`
4. **Jogador da vez clica numa opção:**
   - Cliente emite `resposta_enviada { codigo, user_id, indice_escolhido }`
   - Botões ficam desabilitados pra todos
5. **Servidor valida e calcula:**
   - Compara `indice_escolhido` com `resposta_correta`
   - Se acertou: soma pontos + gerencia combo
   - Se errou: zera combo do jogador
   - Atualiza placar geral
6. Servidor emite `resultado_rodada` pra TODOS com:
   - ID do jogador que respondeu
   - Índice que ele escolheu
   - Índice correto
   - Se acertou (bool)
   - Pontos ganhos nesta rodada
   - Placar atualizado de todos
7. **Cliente (todos):**
   - Mostra feedback visual (verde / vermelho) por **3 segundos**
   - Botão escolhido pelo jogador da vez: verde (acerto) ou vermelho (erro)
   - Resposta correta: sempre em verde destaque
   - Outros botões: opacidade 40%
8. Após 3s, servidor emite `proxima_rodada`:
   - Incrementa `indice_turno_atual`
   - Se ainda há rodadas: emite `nova_pergunta` pro próximo jogador
   - Se acabaram: vai pra Fase 4

#### Fase 4: Fim de Jogo

1. Após a 10ª rodada, servidor:
   - Ordena jogadores por pontuação
   - Marca status da sala como `finalizada`
   - Salva pontuação de cada jogador no banco (tabela `pontuacoes`)
2. Emite `fim_de_jogo` pra todos com:
   - Ranking final (posição, nome, pontos)
   - Vencedor (1º lugar)
3. **Cliente:**
   - Mostra tela de resultado com pódio (1º, 2º, 3º)
   - Lista completa do ranking
   - Botões: **Jogar Novamente** (mesma sala) e **Voltar ao Menu**

### Regras de Pontuação (multiplayer)

| Evento | Pontos |
|--------|--------|
| Acerto fácil | +10 |
| Acerto médio | +20 |
| Acerto difícil | +30 |
| Combo (acertos consecutivos do MESMO jogador) | +5 após o 2º acerto seguido |
| Erro | 0 (turno passa normalmente) |

**Diferença do solo:** no multiplayer **não há vidas**. Errar só significa não pontuar naquela rodada.

### Regras de Turnos

- Ordem definida no início da partida (embaralhada)
- Cada jogador responde 1 vez por rodada
- Total de rodadas = 10 (independente do número de jogadores)
- Se um jogador desconectar durante a partida:
  - Removido da sala
  - Se era a vez dele, servidor pula automaticamente pro próximo
  - Jogadores restantes continuam normalmente

---

## 🔌 Eventos Socket.io

### Cliente → Servidor

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `criar_sala` | `{ user_id, username }` | Cria nova sala |
| `entrar_sala` | `{ codigo, user_id, username }` | Entra em sala existente |
| `iniciar_partida` | `{ codigo }` | Host inicia o jogo |
| `resposta_enviada` | `{ codigo, user_id, indice_escolhido }` | Jogador da vez responde |
| `sair_sala` | `{ codigo, user_id }` | Sai da sala |

### Servidor → Cliente

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `sala_criada` | `{ codigo, jogadores[] }` | Confirmação de criação |
| `jogador_entrou` | `{ jogadores[] }` | Alguém entrou |
| `jogador_saiu` | `{ jogadores[] }` | Alguém saiu |
| `partida_iniciada` | `{ ordem_jogadores[], total_rodadas }` | Partida começou |
| `nova_pergunta` | `{ pergunta, opcoes[], id_da_vez, nome_da_vez, numero_rodada, total_rodadas }` | Nova pergunta |
| `resultado_rodada` | `{ id_jogador, indice_escolhido, resposta_correta, acertou, pontos_ganhos, placar_atualizado[] }` | Resultado da rodada |
| `proxima_rodada` | `{ id_da_vez, nome_da_vez }` | Próximo turno |
| `fim_de_jogo` | `{ ranking[], vencedor }` | Fim da partida |
| `erro` | `{ mensagem }` | Erro genérico |

---

## 🗂️ Estado da Sala (servidor, em memória)

```js
{
  "ABC123": {
    codigo: "ABC123",
    host_id: 1,
    jogadores: [
      { id: 1, username: "joao", socket_id: "xyz", pontos: 0, combo: 0 },
      { id: 2, username: "maria", socket_id: "abc", pontos: 0, combo: 0 }
    ],
    status: "aguardando" | "em_jogo" | "finalizada",
    perguntas: [...],           // 10 perguntas da partida
    rodada_atual: 0,
    ordem_turnos: [1, 2],       // ids na ordem de resposta
    indice_turno_atual: 0,
    resposta_pendente: null
  }
}
```

**Importante:** salas vivem apenas em memória. Só são persistidas no banco as **pontuações finais** (tabela `pontuacoes`).

---

## 📡 Endpoints REST

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/auth/me` | Dados do usuário logado |

### Perguntas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/perguntas?limite=10` | Lista perguntas aleatórias |
| GET | `/api/perguntas/:id` | Detalhe de uma pergunta |

### Pontuações

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/pontuacoes` | Salva pontuação (solo ou multiplayer) |
| GET | `/api/pontuacoes/ranking` | Top 10 global |
| GET | `/api/pontuacoes/eu` | Minhas pontuações |

---

## 🧠 Regras de Negócio Importantes

### Autoridade do Servidor

- **Nunca** confiar no cliente pra:
  - Validar resposta correta
  - Calcular pontos
  - Decidir turnos
  - Verificar se a sala tá cheia ou disponível
- Toda validação acontece no servidor antes de emitir eventos

### Embaralhamento

- Perguntas: embaralhadas **no servidor** antes de enviar
- Opções de cada pergunta: embaralhadas no servidor, com `resposta_correta` ajustada ao novo índice
- Ordem dos turnos: embaralhada no início da partida

### Combos

- Combo é **por jogador** (não por sala)
- Só conta em **acertos consecutivos do mesmo jogador**
- Erro zera o combo do jogador
- Bônus aplicado a partir do 3º acerto seguido

### Desconexões

- Se um jogador desconectar:
  - Servidor remove ele da sala
  - Emite `jogador_saiu` pra todos
  - Se era a vez dele: pula pro próximo
  - Se a sala ficar com 0 jogadores: apaga a sala
  - Se o host sair: promove o próximo jogador a host
- Se reconectar (mesmo `user_id`):
  - Não há suporte a reconexão na v1
  - Jogador precisa entrar numa nova sala

### Validações

- Código de sala: 6 caracteres alfanuméricos maiúsculos
- Antes de criar sala: verifica se código já existe (raro, mas trata colisão)
- Antes de entrar: verifica se sala existe e se não tá cheia (máx 6)
- Antes de iniciar: verifica se é o host e se há 2+ jogadores
- Antes de responder: verifica se é a vez do jogador e se ele ainda não respondeu

---

## 🎯 Fluxo de Estados (cliente)

### Estado Global (AuthContext)

```js
{
  user: { id, username } | null,
  token: string | null,
  isAuthenticated: boolean,
  login(username, password),
  register(username, password),
  logout()
}
```

### Estado do Solo

```js
{
  perguntaAtual,
  opcoes,
  respostaEscolhida,
  jaRespondeu,
  pontos,
  vidas,
  rodadaAtual,
  totalRodadas
}
```

### Estado do Multiplayer

```js
{
  codigoSala,
  jogadores: [],
  status: "aguardando" | "em_jogo" | "finalizada",
  perguntaAtual,
  opcoes,
  idDaVez,
  nomeDaVez,
  rodadaAtual,
  totalRodadas,
  respostaEscolhida,
  jaRespondeu,
  placar: [],
  resultadoRodada: null,
  rankingFinal: null
}
```

---

## 🧩 Componentes e Responsabilidades

| Componente | Responsabilidade |
|------------|------------------|
| `AuthContext` | Estado global de autenticação |
| `ProtectedRoute` | Bloqueia rotas privadas sem token |
| `Menu.jsx` | Menu principal pós-login |
| `Quiz.jsx` | Tela de pergunta (solo ou multiplayer) |
| `Resultado.jsx` | Resultado do modo solo |
| `Lobby.jsx` | Criar / entrar em sala |
| `SalaJogo.jsx` | Tela do quiz multiplayer |
| `ResultadoMultiplayer.jsx` | Pódio e ranking final |
| `Ranking.jsx` | Top 10 global |
| `socket.js` | Cliente Socket.io configurado |

---

## 🚦 Estados Visuais do Quiz

Cada botão de resposta pode estar em:

| Estado | Aparência | Quando |
|--------|-----------|--------|
| `neutro` | Bege, borda sutil | Antes de responder |
| `selecionado-correto` | Verde, ✓ | Jogador acertou |
| `selecionado-errado` | Vermelho, ✗ | Jogador errou |
| `correto-revelado` | Verde destacado | Resposta certa revelada |
| `desabilitado` | Opacidade 50% | Não é a vez do jogador |
| `descartado` | Opacidade 40% | Outras opções após resposta |

---

## ⏱️ Temporizações

| Ação | Tempo |
|------|-------|
| Feedback visual após resposta | 3s (multiplayer) / 1.5s (solo) |
| Expiração do JWT | 7 dias |
| Timeout de resposta do Socket.io | 10s (padrão) |
| Reconexão automática Socket.io | Tentativas progressivas |

---

## ✅ Critérios de Aceite

### Solo

- [ ] Jogador logado consegue iniciar uma partida solo
- [ ] Cada resposta mostra feedback visual correto
- [ ] Erro subtrai vida; 0 vidas encerra a partida
- [ ] Pontuação é salva no banco ao final
- [ ] Botão "Jogar Novamente" reinicia a partida

### Multiplayer

- [ ] Criar sala gera código único de 6 caracteres
- [ ] Entrar em sala com código válido funciona
- [ ] Lista de jogadores atualiza em tempo real
- [ ] Só o host pode iniciar
- [ ] Todos veem a mesma pergunta, mas só o da vez responde
- [ ] Resultado da rodada aparece pra todos simultaneamente
- [ ] Turnos passam na ordem correta
- [ ] Ao final, ranking e pódio aparecem corretamente
- [ ] Pontuações são salvas no banco
- [ ] Desconexões não quebram a partida

---

## 🔗 Referências Cruzadas

- **Layout e estilos visuais** → `layout.md`
- **Stack, arquitetura, banco de dados** → `SDD.md`
- **Roadmap de desenvolvimento** → seção 9 do `SDD.md`