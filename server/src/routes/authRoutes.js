const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

// O cadastro publico foi removido: contas sao criadas apenas pelo admin.
router.post('/login', authLimiter, asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));
router.post('/change-password', authMiddleware, asyncHandler(authController.alterarSenha));
router.put('/ranking-visibilidade', authMiddleware, asyncHandler(authController.definirVisibilidadeRanking));

module.exports = router;
