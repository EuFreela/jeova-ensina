# SDD — Adivinhação Bíblica

**Software Design Document**

| Campo | Valor |
|-------|-------|
| Nome do Projeto | Adivinhação Bíblica |
| Versão | 1.0 |
| Stack | React + Node.js + Express + Tailwind CSS + SQLite |
| Plataforma | Web (mobile-first) |
| Autor | [Seu nome] |
| Data | [Data] |

---

## 1. Visão Geral

### 1.1 Objetivo

Criar um jogo de quiz bíblico online com sistema de login, onde o usuário responde perguntas de múltipla escolha sobre a Bíblia, acumula pontos e compete num ranking global.

### 1.2 Público-alvo

- Jovens e adultos interessados em estudar a Bíblia
- Estudantes de escolas dominicais
- Membros de congregações que querem testar conhecimento
- Público geral curioso sobre cultura bíblica

### 1.3 Escopo

**Dentro do escopo:**
- Cadastro e login de usuários
- Quiz com perguntas de múltipla escolha
- Sistema de pontuação
- Ranking global
- Interface responsiva (mobile-first)

**Fora do escopo (v1):**
- Modo multiplayer em tempo real
- Chat entre usuários
- Sistema de conquistas/badges
- Integração com redes sociais
- App nativo (iOS/Android)

---

## 2. Stack Técnica

### 2.1 Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18+ | Biblioteca de UI |
| Vite | 5+ | Build tool |
| Tailwind CSS | 4+ | Estilização |
| React Router | 6+ | Navegação entre páginas |
| Axios | 1+ | Requisições HTTP |
| Context API | (nativo) | Estado global de autenticação |

### 2.2 Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20+ | Runtime |
| Express | 4+ | Framework HTTP |
| bcrypt | 5+ | Hash de senhas |
| jsonwebtoken | 9+ | Autenticação JWT |
| Sequelize | 6+ | ORM |
| SQLite | 3+ | Banco de dados (dev) |
| PostgreSQL | 15+ | Banco de dados (produção) |
| dotenv | 16+ | Variáveis de ambiente |
| cors | 2+ | CORS |

### 2.3 DevOps

| Ferramenta | Uso |
|------------|-----|
| Git + GitHub | Versionamento |
| ESLint + Prettier | Lint e formatação |
| Vercel / Netlify | Deploy frontend |
| Render / Railway | Deploy backend |

---

## 3. Arquitetura

### 3.1 Estrutura de Pastas

```
adivinha-biblica/
├── client/                     # Frontend React
│   ├── public/
│   │   └── data/
│   │       └── perguntas.json  # Fallback local das perguntas
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── Botao.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/              # Páginas (rotas)
│   │   │   ├── Login.jsx
│   │   │   ├── Cadastro.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── Resultado.jsx
│   │   │   └── Ranking.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── perguntas.js
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                     # Backend Node
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── perguntaController.js
│   │   │   └── pontuacaoController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Pergunta.js
│   │   │   └── Pontuacao.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── perguntaRoutes.js
│   │   │   └── pontuacaoRoutes.js
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   ├── seeders/
│   │   │   └── seedPerguntas.js
│   │   └── app.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── .gitignore
├── README.md
└── SDD.md
```

### 3.2 Diagrama de Fluxo

```
[Usuário]
   │
   ▼
[Login/Cadastro] ──→ JWT salvo no localStorage
   │
   ▼
[Menu Principal]
   │
   ├──→ [Novo Jogo] ──→ [Quiz] ──→ [Resultado] ──→ [Salvar pontuação]
   │
   ├──→ [Ranking Global]
   │
   └──→ [Logout]
```

---

## 4. Modelo de Dados

### 4.1 Tabela: `users`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | INTEGER | PK, AUTO_INCREMENT |
| username | STRING(50) | UNIQUE, NOT NULL |
| password | STRING(255) | NOT NULL (hash bcrypt) |
| created_at | DATETIME | DEFAULT NOW |
| updated_at | DATETIME | DEFAULT NOW |

### 4.2 Tabela: `perguntas`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | INTEGER | PK, AUTO_INCREMENT |
| pergunta | TEXT | NOT NULL |
| opcoes | JSON | NOT NULL (array de 4 strings) |
| resposta_correta | INTEGER | NOT NULL (0-3) |
| categoria | STRING(50) | NOT NULL |
| dificuldade | STRING(10) | NOT NULL (facil/medio/dificil) |
| referencia | STRING(100) | NULL (ex: "Gênesis 1:1") |
| created_at | DATETIME | DEFAULT NOW |

### 4.3 Tabela: `pontuacoes`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| id | INTEGER | PK, AUTO_INCREMENT |
| user_id | INTEGER | FK → users.id |
| pontuacao | INTEGER | NOT NULL |
| acertos | INTEGER | NOT NULL |
| total_perguntas | INTEGER | NOT NULL |
| created_at | DATETIME | DEFAULT NOW |

---

## 5. Endpoints da API

### 5.1 Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/register` | Cadastro de usuário | Não |
| POST | `/api/auth/login` | Login, retorna JWT | Não |
| GET | `/api/auth/me` | Dados do usuário logado | Sim |

### 5.2 Perguntas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/perguntas` | Lista perguntas (filtros) | Sim |
| GET | `/api/perguntas/:id` | Detalhe de pergunta | Sim |

Query params para `/api/perguntas`:
- `?categoria=personagens`
- `?dificuldade=facil`
- `?limite=10`

### 5.3 Pontuações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/pontuacoes` | Salvar pontuação | Sim |
| GET | `/api/pontuacoes/ranking` | Top 10 global | Não |
| GET | `/api/pontuacoes/eu` | Minhas pontuações | Sim |

### 5.4 Exemplo de Request/Response

**POST `/api/auth/login`**

Request:
```json
{
  "username": "joao",
  "password": "senha123"
}
```

Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "joao"
  }
}
```

Response (401):
```json
{
  "error": "Credenciais inválidas"
}
```

---

## 6. Telas (UI/UX)

### 6.1 Identidade Visual

**Paleta de cores:**

| Elemento | Cor | Hex |
|----------|-----|-----|
| Fundo | Azul escuro | `#1a2b4a` |
| Primária (botões) | Dourado | `#e8b84c` |
| Secundária | Azul aço | `#3d5a80` |
| Texto claro | Branco | `#ffffff` |
| Texto secundário | Cinza azulado | `#b8c4d9` |
| Erro | Laranja avermelhado | `#ff6b4a` |
| Sucesso | Verde | `#4ade80` |

**Tipografia:**
- Fonte principal: **Poppins** (Google Fonts)
- Fonte secundária: **Inter**
- Tamanhos: título 32-44px, subtítulo 18-24px, corpo 16px

**Mobile-first:** todas as telas pensadas pra rodar bem em 360px de largura mínima.

### 6.2 Tela: Login

**Elementos:**
- Título "Adivinhação Bíblica"
- Subtítulo "Teste seus conhecimentos"
- Campo "Nome de usuário"
- Campo "Senha"
- Botão "Entrar"
- Link "Não tem conta? Cadastre-se"

**Validações:**
- Username: 3-50 caracteres, sem espaços
- Senha: mínimo 6 caracteres

### 6.3 Tela: Cadastro

Mesma estrutura do Login, mas com campo adicional "Confirmar senha" e botão "Criar Conta".

### 6.4 Tela: Menu Principal

**Elementos:**
- Saudação: "Olá, [nome]!"
- Botão "Novo Jogo"
- Botão "Ranking"
- Botão "Sair"
- Pontuação máxima do usuário (se houver)

### 6.5 Tela: Quiz

**Elementos:**
- Topo: nome do jogador + pontuação atual + contador (ex: "3/10")
- Barra de progresso
- Pergunta em destaque
- 4 botões de resposta (empilhados)
- Feedback visual (verde/vermelho) ao responder
- Timer opcional (30s por pergunta)

**Fluxo:**
1. Carrega pergunta
2. Usuário clica numa opção
3. Valida
4. Mostra feedback (1.5s)
5. Avança para próxima
6. Repete até acabar
7. Vai pra tela de resultado

### 6.6 Tela: Resultado

**Elementos:**
- Título "Fim de Jogo"
- Pontuação final em destaque
- Acertos / total
- Porcentagem
- Botão "Jogar Novamente"
- Botão "Voltar ao Menu"
- Botão "Ver Ranking"

### 6.7 Tela: Ranking

**Elementos:**
- Título "Top 10"
- Lista: posição, nome, pontuação
- Destaque para o usuário logado
- Botão "Voltar"

---

## 7. Autenticação e Segurança

### 7.1 Fluxo JWT

1. Usuário faz login → servidor valida credenciais
2. Servidor gera JWT com `{ id, username }` e expiração de 7 dias
3. Cliente salva token no `localStorage`
4. Toda requisição autenticada envia header `Authorization: Bearer <token>`
5. Middleware no servidor valida token antes de processar rotas protegidas

### 7.2 Boas práticas

- Senhas SEMPRE com hash bcrypt (10 rounds)
- Nunca retornar senha em respostas da API
- Validação de entrada em ambos lados (frontend e backend)
- Rate limiting em rotas de auth (evitar brute force)
- CORS configurado pra domínios específicos em produção
- Variáveis sensíveis em `.env` (nunca no Git)
- HTTPS obrigatório em produção

### 7.3 Middleware de Auth

```javascript
// server/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

---

## 8. Lógica do Jogo

### 8.1 Carregamento de Perguntas

1. Cliente requisita `GET /api/perguntas?limite=10`
2. Servidor embaralha e retorna array de perguntas
3. Cada pergunta vem com `opcoes` embaralhadas e `resposta_correta` já ajustada ao novo índice
4. Cliente armazena em estado local

### 8.2 Pontuação

| Evento | Pontos |
|--------|--------|
| Acerto fácil | +10 |
| Acerto médio | +20 |
| Acerto difícil | +30 |
| Combo 3 acertos seguidos | +5 bônus |
| Combo 5 acertos seguidos | +15 bônus |
| Erro | 0 |

### 8.3 Fim de Jogo

1. Usuário responde todas as perguntas
2. Cliente calcula pontuação final
3. Cliente envia `POST /api/pontuacoes` com o resultado
4. Servidor salva e retorna sucesso
5. Cliente redireciona pra tela de resultado

---

## 9. Roadmap de Desenvolvimento

### Fase 1: Setup (dia 1)
- [ ] Criar estrutura de pastas
- [ ] Configurar backend (Express + SQLite + Sequelize)
- [ ] Configurar frontend (Vite + React + Tailwind)
- [ ] Configurar Git + .gitignore

### Fase 2: Autenticação (dia 2-3)
- [ ] Modelo User + migrations
- [ ] Rotas de register/login
- [ ] Middleware de auth
- [ ] AuthContext no frontend
- [ ] Páginas de Login e Cadastro
- [ ] Proteção de rotas privadas

### Fase 3: Perguntas (dia 4)
- [ ] Modelo Pergunta
- [ ] Seeder com 50+ perguntas bíblicas
- [ ] Rota GET /api/perguntas
- [ ] Embaralhamento de perguntas e opções

### Fase 4: Jogo (dia 5-6)
- [ ] Tela de Menu
- [ ] Tela de Quiz
- [ ] Lógica de pontuação
- [ ] Tela de Resultado
- [ ] Salvar pontuação

### Fase 5: Ranking (dia 7)
- [ ] Rota GET /api/pontuacoes/ranking
- [ ] Tela de Ranking
- [ ] Destaque para usuário logado

### Fase 6: Polimento (dia 8-10)
- [ ] Animações e transições
- [ ] Timer por pergunta
- [ ] Sistema de combo
- [ ] Responsividade fina
- [ ] Testes manuais
- [ ] Deploy

---

## 10. Critérios de Aceite

### 10.1 Funcionais

- [ ] Usuário consegue se cadastrar com username único
- [ ] Usuário consegue fazer login e permanece logado ao recarregar
- [ ] Usuário consegue jogar uma partida completa
- [ ] Pontuação é salva no banco
- [ ] Ranking mostra top 10 corretamente
- [ ] Logout limpa token e redireciona pra login

### 10.2 Não-funcionais

- [ ] Interface funciona em telas de 360px até 1920px
- [ ] Tempo de resposta da API < 500ms
- [ ] Senhas armazenadas com hash (nunca em texto puro)
- [ ] Rotas privadas exigem token válido
- [ ] Sem erros no console do navegador em produção

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Vazamento de senhas | Baixa | Alto | bcrypt + HTTPS + rate limiting |
| SQL Injection | Baixa | Alto | Sequelize com prepared statements |
| XSS | Média | Médio | React escapa HTML por padrão |
| Token expirado | Média | Baixo | Renovação automática ou re-login |
| Latência em picos | Média | Médio | Cache + CDN no frontend |
| Perguntas com erro | Média | Baixo | Revisão manual + report de bugs |

---

## 12. Referências

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Express Docs](https://expressjs.com)
- [Sequelize Docs](https://sequelize.org)
- [JWT.io](https://jwt.io)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 13. Glossário

| Termo | Definição |
|-------|-----------|
| JWT | JSON Web Token — padrão de autenticação stateless |
| Hash | Transformação irreversível de dados (usado em senhas) |
| Middleware | Função que intercepta requisições antes do handler final |
| ORM | Object-Relational Mapping — abstração do banco |
| Seeder | Script que popula o banco com dados iniciais |
| Mobile-first | Design pensado primeiro para telas pequenas |
| Combo | Bônus por acertos consecutivos |

---

**Fim do documento.**