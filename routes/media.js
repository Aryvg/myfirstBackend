const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.get('/', mediaController.listMedia);
router.get('/file/:name', mediaController.getFile);

module.exports = router;
