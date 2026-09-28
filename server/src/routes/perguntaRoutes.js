const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const perguntaController = require('../controllers/perguntaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/', asyncHandler(perguntaController.listar));
router.get('/categorias', asyncHandler(perguntaController.categorias));
router.get('/:id', asyncHandler(perguntaController.detalhe));

module.exports = router;
