/**
 * Versiculo do dia.
 *
 * Os versiculos ficam em `public/data/versiculos.json` e sao servidos como
 * arquivo estatico: nao ha endpoint para isso no servidor, e nao precisa
 * haver. O arquivo existe desde o inicio do projeto mas nao era importado
 * por lugar nenhum — era dado morto.
 *
 * A escolha e deterministica pelo dia local (ano, mes e dia concatenados),
 * entao todo mundo ve o mesmo versiculo no mesmo dia, a aba recarregar nao
 * troca, e recarregar a pagina mil vezes nao sorteia outra. Com 20
 * versiculos e um ciclo de 20 dias, o sorteio se repete — de proposito: nao
 * ha um numero de estado global no servidor para guardar "o dia" e assim
 * funciona offline, com multiplos usuarios e em mais de uma instancia.
 */

/** Caminho relativo a public/, respeitando o base configurado no Vite. */
const CAMINHO = `${import.meta.env.BASE_URL}data/versiculos.json`;

let cache = null;

/** Carrega a lista uma vez e reaproveita nas demais chamadas. */
async function carregar() {
  if (cache) return cache;

  const resposta = await fetch(CAMINHO);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar os versiculos (HTTP ${resposta.status}).`);
  }

  const lista = await resposta.json();
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new Error('O arquivo de versiculos veio vazio ou em formato invalido.');
  }

  cache = lista;
  return cache;
}

/**
 * Dia local em YYYYMMDD. Usa a data local, e nao a UTC: "o versiculo de
 * hoje" deve virar a meia-noite de onde o leitor esta.
 */
function diaDeHoje(agora = new Date()) {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return Number(`${ano}${mes}${dia}`);
}

/**
 * @returns {Promise<{texto: string, referencia: string}>}
 * @throws quando o arquivo nao pode ser lido ou esta invalido.
 */
export async function versiculoDoDia(agora) {
  const lista = await carregar();
  return lista[diaDeHoje(agora) % lista.length];
}

/** Usado nos testes: limpa o cache para forcar nova leitura do arquivo. */
export function limparCache() {
  cache = null;
}