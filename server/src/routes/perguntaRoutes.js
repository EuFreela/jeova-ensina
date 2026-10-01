const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const perguntaController = require('../controllers/perguntaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { vereditoLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/', asyncHandler(perguntaController.listar));
router.get('/categorias', asyncHandler(perguntaController.categorias));

/**
 * Veredito de uma pergunta. Fica ANTES de `/:id` para nao ser capturada pela
 * rota de detalhe, e tem teto proprio: e a unica rota que devolve resposta
 * correta, entao nao pode ser usada para varrer o gabarito inteiro.
 */
router.post('/responder', vereditoLimiter, asyncHandler(perguntaController.responder));

router.get('/:id', asyncHandler(perguntaController.detalhe));

module.exports = router;