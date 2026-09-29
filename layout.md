Layout.md --- Jeová Ensina

Especificação visual e funcional da interface

Projeto: Jeová Ensina
Tipo: Jogo web de perguntas bíblicas de múltipla escolha
Objetivo deste documento: orientar o OpenCode na implementação das
telas, componentes, navegação e identidade visual do jogo.

1. Visão geral do produto

O Jeová Ensina é um jogo de perguntas e respostas baseado na Bíblia.
O usuário entra com sua conta, escolhe uma categoria, responde a
perguntas de múltipla escolha, acumula pontos e acompanha seu desempenho
e sua posição no ranking.

A interface deve transmitir serenidade, confiança, aprendizado e
diversão. O visual combina uma identidade bíblica com uma experiência
moderna de aplicativo, priorizando clareza, acessibilidade e uso em
celulares.

Princípios de design

Mobile-first: projetar primeiro para telas pequenas,
adaptando-se a tablets e desktops.

Visual limpo: cartões com cantos arredondados, espaçamento
consistente e hierarquia tipográfica clara.

Identidade bíblica: usar ilustrações de Bíblia aberta, paisagens
serenas e elementos relacionados ao estudo das Escrituras.

Sem cruzes ou símbolos de cruz: não incluir cruzes em logotipos,
ícones, ilustrações ou elementos decorativos.

Consistência: reutilizar cores, botões, campos, cartões, ícones
e padrões de navegação em todas as telas.

Feedback claro: indicar visualmente respostas
corretas/incorretas, progresso, carregamento e erros.

2. Identidade visual

2.1 Paleta de cores

Usar estas cores como base e centralizá-las em variáveis CSS/Tailwind:

Token             Cor               Hex               Uso

primary         Azul principal    #1557A6         Botões
principais, abas
ativas, links e
destaques

primary-dark    Azul profundo     #12366A         Títulos, textos
fortes e estados
de hover

primary-light   Azul claro        #EAF2FC         Fundos suaves e
áreas
informativas

secondary       Azul aço          #64748B         Ícones e textos
secundários

background      Branco azulado    #F5F7FB         Fundo geral de
telas internas

surface         Branco            #FFFFFF         Cartões,
formulários e
painéis

text            Azul-marinho      #172B4D         Texto principal
escuro

text-muted      Cinza azulado     #7B879B         Descrições,
legendas e
placeholders

border          Cinza claro       #D9E1ED         Bordas de campos
e cartões

accent          Dourado suave     #E9B95A         Detalhes
decorativos e
pequenas ênfases

success         Verde             #229B62         Resposta correta
e confirmação

success-light   Verde suave       #E6F6EC         Fundo de resposta
correta

error           Vermelho          #D94B4B         Resposta
incorreta e
mensagens de erro

2.2 Tipografia

Usar Poppins para títulos e elementos de destaque.

Usar Inter para textos de interface, formulários, botões e
descrições.

Títulos principais: aproximadamente 28--36 px no desktop e 24--30 px
no mobile.

Texto padrão: 15--16 px.

Legendas: 12--14 px.

Manter contraste suficiente entre texto e fundo.

2.3 Formas, sombras e espaçamento

Cartões: raio de borda entre 14 e 22 px.

Campos e botões: raio de borda entre 10 e 16 px; botões principais
podem ser mais arredondados.

Sombras discretas, sem excesso de profundidade.

Usar uma escala consistente de espaçamento baseada em múltiplos de 4
ou 8 px.

Áreas clicáveis devem ter altura confortável, idealmente a partir de
44 px.

2.4 Iconografia

Utilizar uma biblioteca de ícones consistente, como Lucide.

Ícones simples, com traço uniforme.

Ícone principal da marca: Bíblia aberta, com detalhes em azul e
dourado.

Não usar cruzes.

3. Layout global e navegação

3.1 Estrutura das telas autenticadas

As telas internas devem compartilhar: 1. Cabeçalho com marca reduzida
"Jeová Ensina". 2. Área principal com conteúdo em cartões. 3. Navegação
inferior fixa no mobile. 4. Navegação adaptada para desktop, sem ocupar
espaço excessivo.

3.2 Navegação inferior no mobile

Exibir quatro destinos: - Início --- ícone de casa. - Jogar ---
ícone de play. - Ranking --- ícone de gráfico/colunas. - Perfil
--- ícone de usuário.

A opção ativa deve usar azul principal e rótulo destacado. As demais
ficam em azul aço/cinza. A barra deve respeitar a área segura do
dispositivo e não cobrir o conteúdo.

3.3 Cabeçalho

Marca "Jeová Ensina" à esquerda.

À direita, botão de notificações (se houver notificações
implementadas) e avatar com iniciais do usuário.

O avatar abre o perfil ou um menu de conta.

Em telas secundárias, incluir botão de voltar e título centralizado
ou alinhado à esquerda, conforme o espaço disponível.

4. Tela de login

Objetivo

Permitir que o usuário entre na conta ou navegue para o cadastro.

Composição visual

Tela com fundo ilustrado de paisagem serena ao amanhecer/entardecer,
com montanhas, água, vegetação e uma Bíblia aberta em primeiro
plano.

Sobre o fundo, apresentar um painel branco ou branco translúcido com
cantos arredondados.

Em telas largas, usar composição em duas áreas:

Área de marca: ícone de Bíblia aberta, nome "Jeová Ensina",
frase "Teste seu conhecimento da Palavra de Deus" e pequenos
elementos/ícones de "Aprenda", "Jogue" e "Compita".

Área de formulário: cartão de login.

Em telas estreitas, empilhar os elementos e priorizar o formulário.
A imagem de fundo pode receber uma camada clara para garantir
legibilidade.

Elementos do formulário

Título: "Bem-vindo!"

Texto auxiliar: "Entre para jogar, aprender e testar seu
conhecimento das Escrituras."

Alternador de abas: Entrar e Cadastrar.

Campo E-mail com ícone de envelope.

Campo Senha com ícone de cadeado e controle para mostrar/ocultar
senha.

Opção Lembrar de mim.

Link Esqueci minha senha?

Botão principal Entrar, em azul, largura total.

Separador com texto "ou".

Botão secundário Entrar com Google (somente se a autenticação
Google for implementada).

Texto inferior indicando que o jogo é baseado na Bíblia e incentiva
o conhecimento das Escrituras.

Comportamento

Validar campos obrigatórios.

Exibir mensagens de erro próximas aos campos.

Mostrar estado de carregamento ao enviar.

Após autenticação bem-sucedida, redirecionar para a tela Início.

A aba "Cadastrar" abre a tela/formulário de cadastro.

O link de recuperação abre o fluxo de redefinição de senha, caso
implementado.

5. Tela inicial (Home)

Objetivo

Apresentar boas-vindas e permitir iniciar rapidamente uma partida.

Composição

Cabeçalho com marca, notificações (opcional) e avatar.

Saudação personalizada: "Olá, {nome}!"

Mensagem curta: "Que bom ver você por aqui!"

Cartão de versículo do dia, com ícone de Bíblia e referência
bíblica.

O texto e a referência devem vir de dados configuráveis; não
fixar um versículo aleatório no componente.

Cartão principal azul Novo Jogo, com ícone de play, descrição
"Responda perguntas e acumule pontos" e seta.

Cartão Escolher Categoria, com descrição breve.

Cartão Ranking, com chamada para ver os melhores jogadores.

Cartão Meu Perfil, com acesso a pontos, histórico e
estatísticas.

Navegação inferior: Início, Jogar, Ranking e Perfil.

Comportamento

O botão "Novo Jogo" inicia uma partida com a configuração padrão.

"Escolher Categoria" abre a tela de categorias.

"Ranking" abre a classificação.

"Meu Perfil" abre o perfil do usuário.

Exibir pontuação máxima ou resumo de desempenho quando houver dados.

6. Tela de escolha de categoria

Objetivo

Permitir selecionar o tema das perguntas antes de começar.

Cabeçalho

Botão voltar.

Título: "Escolher Categoria".

Lista de categorias

Apresentar cartões verticais, cada um com miniatura/ilustração, título,
descrição e seta: 1. Livros da Bíblia --- "Perguntas sobre os livros
e seus conteúdos". 2. Personagens Bíblicos --- "Homens e mulheres de
fé". 3. Lugares da Bíblia --- "Cidades, países e regiões". 4.
Ensinamentos --- "O que a Bíblia nos ensina". 5. Profecias ---
"Eventos e profecias bíblicas". 6. Organização de Jeová ---
"História e atividades".

Comportamento

Ao selecionar uma categoria, indicar visualmente a seleção e iniciar
ou apresentar a configuração da partida.

A lista deve ser dinâmica, preparada para receber categorias do
backend.

Se uma categoria não tiver perguntas disponíveis, informar isso de
forma clara e desabilitar o início.

7. Tela do quiz (pergunta de múltipla escolha)

Objetivo

Exibir uma pergunta por vez, receber a resposta e mostrar feedback.

Cabeçalho

Botão voltar/sair da partida, com confirmação antes de abandonar.

Título "Novo Jogo" ou nome da categoria.

Contador de perguntas, por exemplo "5/10".

Barra de progresso proporcional à pergunta atual.

Conteúdo

Cartão opcional com imagem ilustrativa relacionada à pergunta.

Pergunta em destaque, com boa legibilidade.

Quatro opções de resposta, empilhadas verticalmente, cada uma com:

Identificador (A, B, C, D).

Texto da alternativa.

Área clicável ampla.

Botão Próxima Pergunta, inicialmente desabilitado até o usuário
responder.

Estados visuais das respostas

Padrão: cartão branco com borda cinza clara.

Selecionada: borda azul e fundo azul muito claro.

Correta: borda verde, fundo verde claro e ícone de confirmação.

Incorreta: borda vermelha, fundo vermelho claro e ícone de erro;
também destacar a alternativa correta em verde após a resposta.

Depois de responder, bloquear novas seleções para aquela pergunta.

Fluxo de jogo

Carregar a pergunta e as alternativas.

Usuário seleciona uma alternativa.

Validar a resposta.

Mostrar feedback visual e, se houver, uma explicação curta e
referência bíblica.

Habilitar "Próxima Pergunta".

Avançar até completar a quantidade de perguntas.

Encaminhar para a tela de resultado.

Regras de interface

Exibir a pontuação atual, se fizer parte da configuração do jogo.

Não revelar a resposta correta antes da seleção.

Não incluir cronômetro se ele não estiver habilitado na configuração
da partida.

Manter a tela utilizável em celulares sem rolagem excessiva.

8. Tela de resultado

Objetivo

Mostrar o desempenho da partida e oferecer ações seguintes.

Composição

Título: "Resultado" ou "Fim de Jogo".

Mensagem de conclusão: "Parabéns! Você concluiu o jogo!"

Ilustração de troféu ou elemento comemorativo, sem exagero.

Cartão de desempenho com:

Pontuação total.

Número de acertos.

Número de erros.

Percentual de acertos.

Indicador visual circular ou barra para percentual de acertos.

Mensagem de incentivo ao aprendizado, sem constranger o usuário por
erros.

Botões

Jogar Novamente --- inicia outra partida.

Ver Ranking --- abre o ranking.

Voltar ao Menu --- retorna à Home.

Comportamento

Os valores devem refletir o resultado real da partida.

Salvar a pontuação conforme as regras do backend.

Tratar falha ao salvar a pontuação com aviso e opção de tentar
novamente, sem perder o resultado local.

9. Tela de ranking

Objetivo

Exibir a classificação de jogadores.

Cabeçalho

Botão voltar.

Título: "Ranking Global".

Conteúdo

Abas/filtros:

Geral

Este Mês

Esta Semana

Lista com colunas ou linhas adaptáveis:

Posição.

Avatar/iniciais.

Nome do jogador.

Pontos.

Percentual de acertos, se disponível.

Destacar discretamente a linha do usuário autenticado.

Painel de resumo "Sua posição", com posição, pontos totais, taxa de
acertos e partidas realizadas, quando esses dados existirem.

Responsividade

Em desktop, pode usar tabela.

Em mobile, preferir linhas/cartões compactos, sem exigir rolagem
horizontal.

Exibir estados de carregamento, lista vazia e erro.

10. Tela de perfil

Objetivo

Permitir consultar informações e desempenho do usuário.

Elementos

Avatar com iniciais ou imagem de perfil.

Nome de usuário.

Pontuação total e melhor pontuação.

Total de partidas realizadas.

Taxa de acertos.

Histórico de partidas, se disponível.

Ação para editar dados permitidos.

Botão Sair com confirmação.

11. Tela de cadastro

Elementos

Marca/ícone da Bíblia aberta.

Título "Criar conta".

Texto auxiliar curto.

Campo Nome de usuário.

Campo E-mail, caso o modelo de autenticação use e-mail.

Campo Senha.

Campo Confirmar senha.

Botão Criar Conta.

Link "Já tem uma conta? Entrar".

Mensagens de validação e estado de carregamento.

Validações

Validar campos obrigatórios.

Nome de usuário único, conforme backend.

Validar formato do e-mail quando utilizado.

Senha e confirmação devem coincidir.

Não exibir nem registrar senha em logs.

12. Componentes reutilizáveis

Criar componentes reutilizáveis para manter consistência:

AppHeader --- cabeçalho das telas internas.

BottomNavigation --- navegação inferior mobile.

BrandLogo --- ícone de Bíblia aberta e nome "Jeová Ensina".

PrimaryButton --- botão principal.

SecondaryButton --- botão secundário.

InputField --- campo com rótulo, ícone, erro e suporte a senha.

Card --- cartão base.

CategoryCard --- cartão de categoria.

AnswerOption --- alternativa de resposta com estados.

ProgressBar --- progresso da partida.

ScoreSummary --- resumo de pontuação.

LeaderboardRow --- linha de ranking responsiva.

LoadingState --- carregamento.

EmptyState --- estado sem dados.

ErrorMessage --- mensagem de erro.

ConfirmDialog --- confirmação de saída/ações importantes.

Os componentes devem receber dados por propriedades e evitar lógica de
negócio acoplada à apresentação.

13. Rotas sugeridas

Adaptar às rotas já existentes no projeto. Sugestão:

Rota               Tela                   Acesso

/login           Login                  Público
/cadastro        Cadastro               Público
/ ou /inicio   Home                   Autenticado
/categorias      Escolha de categoria   Autenticado
/quiz            Partida/quiz           Autenticado
/resultado       Resultado              Autenticado
/ranking         Ranking                Público ou autenticado
/perfil          Perfil                 Autenticado

Proteger rotas privadas e redirecionar usuários não autenticados para
/login. Após login, redirecionar para a Home.

14. Responsividade e acessibilidade

Garantir funcionamento a partir de 360 px de largura.

Em mobile, empilhar cartões e campos em uma única coluna.

Em telas grandes, limitar a largura do conteúdo e usar espaços
laterais.

Não depender apenas de cor para indicar acerto/erro: usar ícones e
texto.

Todos os campos devem ter rótulos visíveis e associados.

Botões e opções devem ser navegáveis por teclado.

Incluir foco visível em links, botões e campos.

Imagens decorativas devem ter alt=""; imagens informativas devem
ter texto alternativo adequado.

Respeitar a preferência de redução de movimento do sistema.

Evitar texto sobre imagens sem camada de contraste.

15. Estados que devem ser implementados

Todas as telas com dados assíncronos devem prever: - Carregamento
(skeleton ou indicador discreto). - Sucesso. - Lista vazia/ausência de
conteúdo. - Erro de rede ou servidor. - Ação desabilitada durante
envio. - Mensagens de validação. - Confirmação para abandonar uma
partida em andamento.

16. Orientações técnicas para implementação

O projeto descrito no SDD utiliza React + Vite + Tailwind CSS, com
React Router, e backend Node.js + Express + Sequelize + SQLite
(com PostgreSQL previsto para produção). Respeitar a stack e a estrutura
já existente no repositório; não recriar o projeto nem trocar
tecnologias sem necessidade.

Diretrizes

Separar páginas, componentes reutilizáveis, serviços e estado de
autenticação.

Centralizar tokens de cores e estilos compartilhados.

Evitar duplicação de markup entre telas.

Manter a lógica de autenticação e jogo fora dos componentes
puramente visuais.

Usar dados reais da API quando os endpoints estiverem disponíveis;
durante a construção visual, usar dados mockados claramente
isolados.

Não inventar endpoints ou formatos de resposta sem conferir o
backend existente.

Não armazenar senhas no navegador.

Manter os textos da interface em português do Brasil.

17. Ordem recomendada de implementação

Definir tokens visuais, tipografia e componentes básicos.

Implementar Login e Cadastro.

Implementar layout autenticado, cabeçalho e navegação inferior.

Implementar Home.

Implementar escolha de categoria.

Implementar tela de quiz e estados das alternativas.

Implementar resultado.

Implementar ranking.

Implementar perfil.

Revisar responsividade, acessibilidade, estados de erro e
consistência visual.

18. Critérios de aceite visual

A marca aparece como "Jeová Ensina", com ícone de Bíblia aberta
e sem cruzes.

A identidade usa azul, branco e detalhes dourados suaves, com
paisagens serenas nas áreas apropriadas.

Login, Home, Categorias, Quiz, Resultado, Ranking e Perfil seguem o
mesmo sistema visual.

A navegação é clara e funcional em celular e desktop.

As alternativas do quiz mostram estados de seleção, acerto e erro.

O ranking adapta sua apresentação para telas pequenas sem rolagem
horizontal desnecessária.

A interface apresenta estados de carregamento, vazio e erro quando
aplicável.

O conteúdo não fica escondido pela navegação inferior.