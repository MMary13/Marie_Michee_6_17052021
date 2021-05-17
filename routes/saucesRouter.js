const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const saucesCtrl = require('../controllers/saucesCtrl');



//Route: GET all (/api/sauces)
router.get('/', auth, saucesCtrl.getAllSauces);

//Route: GET by ID (/api/sauces/:id)
router.get('/:id', auth, saucesCtrl.getOneSauce);

//Route: POST (/api/sauces)
router.post('/', auth, multer, saucesCtrl.createSauce);

//Route: PUT (/api/sauces/:id)
router.put('/:id', auth, multer, saucesCtrl.modifySauce);

//Route: DELETE (/api/sauces/:id)
router.delete('/:id', auth, saucesCtrl.deleteSauce);

//Route: POST (/api/sauces/:id/like)
router.post('/:id/like', saucesCtrl.modifyLikes);

module.exports = router;