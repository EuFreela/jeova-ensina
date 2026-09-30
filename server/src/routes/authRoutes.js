const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter, senhaLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

// O cadastro publico foi removido: contas sao criadas apenas pelo admin.
router.post('/login', authLimiter, asyncHandler(authController.login));
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
