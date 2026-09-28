const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const pontuacaoController = require('../controllers/pontuacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const authOpcional = require('../middlewares/authOpcionalMiddleware');

const router = express.Router();

// Ranking é público, mas usa o token quando houver para destacar o jogador
router.get('/ranking', authOpcional, asyncHandler(pontuacaoController.ranking));

router.use(authMiddleware);
router.post('/', asyncHandler(pontuacaoController.salvar));
router.get('/eu', asyncHandler(pontuacaoController.minhas));

module.exports = router;
