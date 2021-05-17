const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userCtrl');

//Route: POST signup (/api/auth/signup)
router.post('/signup', userCtrl.signup);

//Route: POST login (/api/auth/login)
router.post('/login', userCtrl.login);

module.exports = router;