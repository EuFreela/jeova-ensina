/**
 * O Express 4 nao captura rejeicoes de handlers async: um erro de banco
 * dentro de um async controller derrubaria o processo inteiro. Este wrapper
 * encaminha a rejeicao para o errorHandler.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
