const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/role');

router.use(authMiddleware);
router.use(adminMiddleware);

router.delete('/posts/:id', );
router.get('/posts', );

module.exports = router;