const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas exigem autenticacao + perfil de administrador.
router.use(authMiddleware, authMiddleware.requireAdmin);

router.get('/usuarios', asyncHandler(adminController.listarUsuarios));
router.post('/usuarios', asyncHandler(adminController.criarUsuario));
// Novo codigo de 4 digitos (botao de atualizar na tela de criacao)
router.post('/usuarios/:id/codigo', asyncHandler(adminController.atualizarCodigo));
router.delete('/usuarios/:id', asyncHandler(adminController.excluirUsuario));
router.delete('/usuarios/:id/pontuacoes', asyncHandler(adminController.zerarPontuacao));

module.exports = router;
