require('dotenv').config();
const http = require('http');
const { validarAmbiente } = require('./src/config/ambiente');

const PORT = Number(process.env.PORT) || 3002;

/**
 * Uma rejeicao de promise nao tratada (query que estourou timeout, socket
 * que morreu no meio de um broadcast) derrubaria o processo inteiro sem
 * stack util no log. Loga e segue: o que era para derrubar o servidor o
 * metodo `process.exit` abaixo ja trata explicitamente.
 */
process.on('unhandledRejection', (motivo) => {
  console.error('[promessa rejeitada sem tratamento]', motivo);
});

async function iniciar() {
  // Antes de qualquer require que leia process.env para montar segredos.
  // Um JWT_SECRET ausente nao quebrava o servidor: o jsonwebtoken assinava
  // com a string "undefined" e aceitava token forjado como admin.
  try {
    const { avisos } = validarAmbiente();
    avisos.forEach((aviso) => console.warn(`[aviso] ${aviso}`));
  } catch (err) {
    console.error(`Configuracao invalida: ${err.message}`);
    process.exit(1);
  }

  // Carregados depois da validacao: app/realtime leem o ambiente no require.
  const app = require('./src/app');
  const sequelize = require('./src/config/database');
  const criarRealtime = require('./src/realtime');

  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`Banco de dados pronto (${sequelize.getDialect()})`);
  } catch (err) {
    console.error('Falha ao conectar no banco de dados:', err.message);
    process.exit(1);
  }

  const httpServer = http.createServer(app);
  const realtime = criarRealtime(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('Tempo real (sessoes) ativo via WebSocket');
  });

  /**
   * Encerramento gracioso. Sem isto, SIGTERM no deploy mata o processo no
   * meio de um `persistir`, e o placar dos jogadores que terminaram a
   * partida some junto. O timer de 10s e o rede de seguranca: se alguma
   * conexao travar, o processo sai assim mesmo.
   */
  let encerrando = false;
  async function desligar(sinal) {
    if (encerrando) return;
    encerrando = true;
    console.log(`${sinal} recebido, encerrando...`);

    const forcar = setTimeout(() => {
      console.error('Encerramento travado; saindo a forca.');
      process.exit(1);
    }, 10_000);
    forcar.unref();

    httpServer.close();
    // Derruba sockets e timers de sessao antes de fechar o banco: sem isso
    // um timer de `avancar` ainda dispara e escreve num banco ja fechado.
    realtime.io.close();
    for (const sessao of realtime.sessoes.sessoes.values()) {
      realtime.sessoes.pararTimers(sessao);
    }
    await sequelize.close();

    clearTimeout(forcar);
    console.log('Servidor encerrado.');
    process.exit(0);
  }

  process.on('SIGTERM', () => desligar('SIGTERM'));
  process.on('SIGINT', () => desligar('SIGINT'));
}

iniciar();