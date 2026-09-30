/**
 * Validacao das variaveis de ambiente, executada uma vez no boot.
 *
 * Sem isto, um JWT_SECRET ausente nao quebrava o servidor: o jsonwebtoken
 * assinava e verificava todo token com a string literal "undefined", e
 * qualquer pessoa que soubesse disso forjava tokens de administrador. O
 * servidor subia, respondia 200 no health e parecia saudavel.
 *
 * `validarAmbiente()` e a primeira coisa a rodar: em desenvolvimento so
 * avisa do que e arriscado; em producao recusa subir.
 */

// Segredo que vem no .env.example. Se chegar em producao, o servidor esta
// com a chave que o README manda trocar.
const SEGREDOS_DE_EXEMPLO = [
  'troque-este-segredo-por-um-valor-longo-e-aleatorio',
  'troque-este-segredo',
  'secret',
  'changeme',
];

// 32 bytes em base64 sao ~43 caracteres. Abaixo disso o segredo e curto
// demais para um token que vale 7 dias.
const TAMANHO_MINIMO_SEGREDO = 32;

function ehSegredoDeExemplo(valor) {
  if (!valor) return true;
  const normalizado = String(valor).trim().toLowerCase();
  return SEGREDOS_DE_EXEMPLO.some((exemplo) => normalizado === exemplo);
}

function validarSegredo(nome, valor, { obrigatorio }) {
  if (!valor) {
    if (obrigatorio) throw new Error(`${nome} e obrigatorio: o servidor nao sobe sem ele.`);
    return null;
  }
  if (ehSegredoDeExemplo(valor)) {
    throw new Error(
      `${nome} ainda esta com o valor de exemplo do .env.example. ` +
        'Gere um segredo proprio com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
  if (String(valor).trim().length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(
      `${nome} precisa ter ao menos ${TAMANHO_MINIMO_SEGREDO} caracteres.`
    );
  }
  return String(valor);
}

/**
 * @returns {{producao: boolean, avisos: string[]}}
 * @throws {Error} quando uma variavel obrigatoria falta ou e insegura.
 */
function validarAmbiente(env = process.env) {
  const producao = env.NODE_ENV === 'production';
  const avisos = [];

  // O segredo e obrigatorio em qualquer ambiente: sem ele todo token vira
  // lixo, mesmo em desenvolvimento. O que muda em producao e a exigencia
  // de qualidade (tamanho minimo e recusa do valor de exemplo).
  const exigeQualidade = producao || env.EXIGIR_SEGREDO === 'true';

  if (exigeQualidade) {
    validarSegredo('JWT_SECRET', env.JWT_SECRET, { obrigatorio: true });
  } else if (!env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET nao definido. Copie server/.env.example para server/.env ' +
        'ou exporte a variavel antes de subir o servidor.'
    );
  } else if (ehSegredoDeExemplo(env.JWT_SECRET)) {
    avisos.push(
      'JWT_SECRET esta com o valor de exemplo. Funciona para desenvolvimento, ' +
        'mas nunca suba para producao com ele.'
    );
  }

  if (producao && env.DATABASE_DIALECT === 'sqlite') {
    avisos.push(
      'DATABASE_DIALECT=sqlite em producao. O arquivo local nao e compartilhado ' +
        'entre replicas nem sobrevive a troca de maquina.'
    );
  }

  return { producao, avisos };
}

module.exports = { validarAmbiente, ehSegredoDeExemplo, SEGREDOS_DE_EXEMPLO };
