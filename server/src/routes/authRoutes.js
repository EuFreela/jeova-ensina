const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter, senhaLimiter } = require('../middlewares/rateLimitMiddleware');
const { bloquearContaExcedida } = require('../middlewares/limiteContaMiddleware');

const router = express.Router();

// O cadastro publico foi removido: contas sao criadas apenas pelo admin.
//
// O login tem dois tetos, e eles nao se substituem. O `authLimiter` conta por
// IP e segura o abuso que vem de um endereco so. O `bloquearContaExcedida`
// conta pela conta e segura o que o outro nao pega: tentativas espalhadas em
// varios enderecos contra a MESMA conta. Sem ele, a senha inicial de 4
// digitos (10.000 combinacoes) fica exposta a password spraying de baixa taxa.
router.post('/login', authLimiter, bloquearContaExcedida, asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));
// Troca de senha valida a senha atual: precisa de teto proprio, senao o
// geral (300/min) deixaria brute-force de senha viavel.
router.post('/change-password', senhaLimiter, authMiddleware, asyncHandler(authController.alterarSenha));
// Trocar o nome e uma escrita no perfil, entao entra no mesmo limite de
// escrita da senha: sem teto, dava para martelar o indice unico de
// `username` ate a conta cair.
router.put('/usuario', senhaLimiter, authMiddleware, asyncHandler(authController.alterarUsuario));
router.put('/ranking-visibilidade', authMiddleware, asyncHandler(authController.definirVisibilidadeRanking));

module.exports = router;