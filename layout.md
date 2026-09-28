# Layout — Jeová Ensina

Especificações visuais e de interface do jogo. Documento de referência para estilização das telas.

---

## 🎨 Paleta de Cores

| Token | Hex | Uso |
|-------|-----|-----|
| `fundo-escuro` | `#0a1a3a` | Fundo principal das telas |
| `fundo-gradiente-topo` | `#0a1628` | Topo do degradê da tela inicial |
| `fundo-gradiente-centro` | `#1a2b4a` | Centro do degradê da tela inicial |
| `card-bege` | `#f5e6c8` | Fundo dos cards de pergunta |
| `bege-claro` | `#e8dcc0` | Botões de resposta neutros |
| `borda-bege` | `#c9b88a` | Bordas sutis em elementos beges |
| `texto-escuro` | `#3a2a1a` | Texto principal sobre bege |
| `texto-medio` | `#5a4a2a` | Texto secundário sobre bege |
| `dourado` | `#e8b84c` | Destaques, pontos, vidas, títulos |
| `dourado-suave` | `#b8945a` | Links secundários, texto discreto |
| `dourado-escuro` | `#d4a63e` | Hover de botões dourados |
| `verde-ativo` | `#2d8c6a` | Botões principais, resposta correta |
| `verde-hover` | `#1f6b50` | Hover de botões verdes |
| `vermelho-erro` | `#c94a4a` | Resposta errada, avisos |
| `branco` | `#ffffff` | Texto sobre fundos escuros/verdes |

---

## 📝 Tipografia

| Elemento | Fonte | Tamanho | Peso |
|----------|-------|---------|------|
| Título da tela inicial | Playfair Display / Cinzel (serifada) | 40–48px | Bold |
| Subtítulo | Inter / Poppins | 18–24px | Medium |
| Categoria da pergunta | Inter / Poppins | 12px | Bold, uppercase |
| Pergunta | Inter / Poppins | 22px | Bold |
| Botões de resposta | Inter / Poppins | 16px | Medium |
| Botões principais | Inter / Poppins | 18px | Bold |
| Link secundário | Inter / Poppins | 12–14px | Medium, uppercase |
| Pontos / vidas | Inter / Poppins | 18px | Bold |

**Fontes do Google:**
- `Playfair Display` (títulos serifados)
- `Cinzel` (alternativa)
- `Poppins` (corpo e UI)
- `Inter` (alternativa)

---

## 📐 Espaçamento

| Token | Valor | Uso |
|-------|-------|-----|
| Padding lateral mínimo | `24px` | Todas as telas |
| Padding card interno | `24px` | Cards de pergunta |
| Gap entre botões de resposta | `8px` | Empilhamento vertical |
| Margin entre seções | `24–40px` | Entre blocos principais |
| Border-radius card | `16px` | Cards de pergunta |
| Border-radius botão | `8px` | Botões retangulares |
| Border-radius pill | `9999px` | Botões arredondados |

---

## 📱 Responsividade

- **Mobile-first**: 360px a 480px de largura
- **Tablet/Desktop**: conteúdo centralizado com `max-width: 480px`
- **Safe areas**: nada colado nas bordas (mínimo 24px de padding)
- **Nada passa da viewport**: altura sempre respeitada
- **Fontes e botões**: escalam proporcionalmente

---

## 1. Tela Inicial (Menu)

### Fundo
- Degradê vertical: `#0a1628` (topo) → `#1a2b4a` (centro) → `#0a1628` (base)
- Leve vinheta escura nas bordas pra dar profundidade
- Sensação espiritual / sofisticada

### Estrutura vertical centralizada

**1) Botão de voltar (topo esquerdo)**
- Ícone: seta esquerda (←)
- Cor: `#d4a63e`
- Tamanho: 24px
- Fundo: transparente, sem borda
- Padding: 16px do topo e 16px da esquerda

**2) Ilustração do livro aberto (centro-superior)**
- Imagem de Bíblia aberta estilizada
- Páginas em `#e8d4a0` e `#c9a961`
- Capa em `#8b6f2f`
- Glow dourado suave atrás
- Tamanho: ~60% da largura da tela
- Posição: ~30% do topo

**3) Título — "Jeová Ensina"**
- Fonte serifada (Playfair Display / Cinzel)
- Cor: degradê `#e8b84c` → `#c9a961`
- Tamanho: 40–48px
- Letter-spacing levemente aumentado
- Sombra suave preta (profundidade)
- Margin-top: ~15% abaixo do livro

**4) Botão principal — "Começar Jogo"**
- Pill (border-radius total)
- Fundo: degradê `#e8b84c` → `#d4a63e`
- Texto: branco, bold, 18px
- Largura: ~70% da tela
- Altura: 56px
- Sombra dourada suave (glow)
- Margin-top: ~40px
- Hover: escurece levemente + aumenta sombra

**5) Link secundário — "JOGAR COM AMIGOS"**
- Texto: uppercase, letter-spacing aumentado
- Cor: `#b8945a`
- Tamanho: 12–14px
- Margin-top: ~24px
- Hover: dourado brilhante (`#e8b84c`)

**6) Saudação (opcional)**
- "Olá, [nome]" discreto, acima do botão principal
- Cor: `#b8945a`

---

## 2. Tela de Quiz (Pergunta e Respostas)

### Fundo
- `#0a1a3a` (azul marinho profundo)
- Centralizado verticalmente
- Padding lateral: 24px

### Cabeçalho
- Flex horizontal, `justify-between`, `items-center`
- **Lado esquerdo**: `Pontos: 150`
  - Cor: `#e8b84c`
  - Fonte: bold, 18px
- **Lado direito**: dois ícones de coração
  - Cor: `#e8b84c`
  - Tamanho: 24px cada
  - Gap: 8px
  - Coração vazio: opacidade 30%

### Card Central da Pergunta
- `max-width: 480px`, centralizado
- Fundo: `#f5e6c8`
- Border-radius: 16px
- Sombra: `shadow-xl`
- Padding: 24px

**Dentro do card:**

**1) Categoria (topo esquerdo)**
- Ex: "História Bíblica", "Personagens", "Livros da Bíblia"
- Fonte: 12px, bold, uppercase
- Cor: `#5a4a2a`
- Letter-spacing aumentado
- Margin-bottom: 12px

**2) Texto da pergunta**
- Fonte: 22px, bold
- Cor: `#3a2a1a`
- Centralizado
- Line-height confortável
- Margin-bottom: 24px
- Suporta até 3 linhas

**3) Lista de 4 botões de resposta**
- Largura: 100%
- Altura: 56px
- Border-radius: 8px
- Gap entre eles: 8px
- Texto: centralizado, medium, 16px

**Estado inicial (sem resposta):**
- Todos os botões: fundo `#e8dcc0`, texto `#3a2a1a`, borda `#c9b88a`

**Após resposta:**
- Botão escolhido (acertou): fundo `#2d8c6a`, texto branco, ícone ✓
- Botão escolhido (errou): fundo `#c94a4a`, texto branco, ícone ✗
- Resposta correta: fundo `#2d8c6a`, texto branco
- Outros botões: opacidade 40%

**Efeitos:**
- Hover (habilitado): escurece levemente, cursor pointer
- Transição: 200ms em todas as cores
- Desabilitado (multiplayer, não é sua vez): `opacity-50` + `cursor-not-allowed` + `pointer-events-none`
- Animação "shake" no botão errado (opcional)

### Botão "Sair do Jogo" (rodapé)
- Abaixo do card, centralizado
- Pill (border-radius total)
- Fundo: `#2d8c6a`
- Texto: branco, bold, 16px
- Padding: 12px 32px
- Largura: automática
- Hover: `#1f6b50`
- Margin-top: 32px

### Banner Multiplayer
- Quando em sala com amigos: `Vez de: [Nome]`
- Destaque no topo da tela
- Cor: dourado `#e8b84c`

### Placar Lateral / Rodapé (multiplayer)
- Lista de jogadores com pontos
- Jogador da vez: destaque dourado
- Atualiza em tempo real

---

## 3. Tela de Lobby (Multiplayer)

### Fundo
- `#0a1a3a`

### Estrutura

**1) Título**: "Jogar com Amigos"
- Serifada, dourada

**2) Criar Sala**
- Botão pill verde `#2d8c6a`
- Texto branco, bold

**3) Entrar em Sala**
- Campo de input (código de 6 caracteres)
- Botão pill verde ao lado

**4) Código da Sala (após criar/entrar)**
- Destaque grande, dourado
- Fonte monoespaçada
- Botão "Copiar" ao lado

**5) Lista de Jogadores**
- Cards empilhados
- Nome + status (host / aguardando / pronto)
- Atualiza em tempo real

**6) Botão "Iniciar Jogo"**
- Só aparece pro host
- Desabilitado se < 2 jogadores
- Pill verde `#2d8c6a`

**7) Botão "Sair da Sala"**
- Link discreto dourado suave

---

## 4. Tela de Resultado (Multiplayer)

### Fundo
- `#0a1a3a`

### Estrutura

**1) Título**: "Fim de Jogo"
- Serifada, dourada

**2) Pódio**
- 1º lugar: centro, mais alto, dourado `#e8b84c`
- 2º lugar: esquerda, prata (`#b8b8b8`)
- 3º lugar: direita, bronze (`#a67c52`)
- Cada um com nome + pontos

**3) Ranking completo**
- Lista abaixo do pódio
- Jogador logado destacado

**4) Botões**
- "Jogar Novamente": pill verde
- "Voltar ao Menu": pill dourado

---

## 🎯 Regras Gerais de Estilo

- **Minimalista**: sem elementos decorativos desnecessários
- **Sofisticado**: tema espiritual / bíblico
- **Contraste forte**: fundo escuro + card claro + dourado
- **Toque suave**: todos elementos clicáveis com área mínima de 44x44px
- **Consistência**: mesmo border-radius e paleta em todas as telas
- **Sem imagens externas obrigatórias**: SVGs inline para ícones (coração, seta, ✓, ✗)

---

## 📦 Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| `BotaoPill` | Botão arredondado (verde ou dourado) |
| `CardPergunta` | Card bege com categoria + pergunta |
| `BotaoResposta` | Botão de opção com estados (neutro, correto, errado, desabilitado) |
| `IconeCoracao` | SVG de coração (cheio ou vazio) |
| `IconeVoltar` | SVG de seta esquerda |
| `PlacarJogadores` | Lista de jogadores com pontos |
| `Podio` | Pódio 1º/2º/3º lugar |

---

## ✅ Checklist de Validação

Antes de considerar uma tela pronta, verificar:

- [ ] Fundo na cor correta (`#0a1a3a` ou degradê)
- [ ] Padding lateral mínimo de 24px
- [ ] Nada passa da viewport
- [ ] Botões com altura mínima de 44px (toque)
- [ ] Cores da paleta respeitadas
- [ ] Tipografia consistente
- [ ] Transições suaves (200ms)
- [ ] Estados de hover / disabled / focus visíveis
- [ ] Funciona em 360px de largura (mobile pequeno)
- [ ] Funciona em 480px de largura (mobile grande)
- [ ] Centralizado em telas maiores (max-width 480px)