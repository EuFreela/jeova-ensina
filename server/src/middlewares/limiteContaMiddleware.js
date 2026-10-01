/**
 * Trava por conta no login.
 *
 * Os limiters acima contam por IP, e IP e o atributo que o atacante controla
 * mais facilmente. Um mesmo IP pode tentar 20 logins/15min contra QUALQUER
 * usuario: e o suficiente para um password spraying com um IP de saida e
 * irrelevante assim que ha alguns ipotes na frente. Aqui o contador e pelo
 * `username`, entao a conta que sofre tentativas e a conta que trava — e o
 * usuario legitimado nao e punido pelo ruido alheio.
 *
 * A senha inicial de uma conta e um codigo de 4 digitos: 10.000 combinacoes.
 * So o limite por IP nao fecha esse espaco quando as tentativas se espalham
 * por varios enderecos, que e o comportamento normal de quem esta tentando.
 *
 * Estado em memoria, como os limiters: reiniciar o processo zera as contagens.
 * Para rodar em mais de uma instancia, mover para o mesmo armazenamento
 * compartilhado usado pelo resto da sessao.
 */

const JANELA = 15 * 60 * 1000;
const MAXIMO_FALHAS = 5;
const MAXIMO_REGISTROS = 10000;

/** username normalizado -> { falhas, primeiraFalhaEm, bloqueadoAte } */
const registros = new Map();

/** A chave e o username em minusculas: "Ana" e "ana" sao a mesma conta. */
function chave(username) {
  return String(username ?? '')
    .trim()
    .toLowerCase();
}

function varreExpirados() {
  const agora = Date.now();
  for (const [k, r] of registros) {
    const expirouJanela = agora - r.primeiraFalhaEm > JANELA;
    if (expirouJanela && (!r.bloqueadoAte || r.bloqueadoAte <= agora)) {
      registros.delete(k);
    }
  }
}

/**
 * Middleware: recusa o login de uma conta que estourou o numero de falhas.
 * Monta antes de `authController.login`, logo depois do limiter por IP.
 */
function bloquearContaExcedida(req, res, next) {
  varreExpirados();
  const registro = registros.get(chave(req.body?.username));
  if (registro?.bloqueadoAte && registro.bloqueadoAte > Date.now()) {
    const minutos = Math.max(1, Math.ceil((registro.bloqueadoAte - Date.now()) / 60000));
    return res
      .status(429)
      .json({ error: `Muitas tentativas para esta conta. Tente novamente em ${minutos} min.` });
  }
  return next();
}

/** Chamado pelo controller quando o login falha. */
function registrarFalha(username) {
  varreExpirados();
  const k = chave(username);
  const agora = Date.now();
  const anterior = registros.get(k);

  if (!anterior || agora - anterior.primeiraFalhaEm > JANELA) {
    registros.set(k, { falhas: 1, primeiraFalhaEm: agora, bloqueadoAte: 0 });
    return;
  }

  anterior.falhas += 1;
  if (anterior.falhas >= MAXIMO_FALHAS) {
    anterior.bloqueadoAte = agora + JANELA;
  }

  while (registros.size > MAXIMO_REGISTROS) {
    const maisAntigo = registros.keys().next().value;
    registros.delete(maisAntigo);
  }
}

/**
 * Chamado pelo controller quando o login da certo.
 *
 * Só zera a conta que entrou: um login valido nunca deve apagar as falhas de
 * outra conta. O `delete` em vez de zerar e o que mantem o mapa do tamanho do
 * numero de usernames que realmente existiram.
 */
function registrarSucesso(username) {
  registros.delete(chave(username));
}

/** Usado pelos testes. */
function limparTentativas() {
  registros.clear();
}

module.exports = {
  MAXIMO_FALHAS,
  JANELA,
  bloquearContaExcedida,
  registrarFalha,
  registrarSucesso,
  limparTentativas,
};
