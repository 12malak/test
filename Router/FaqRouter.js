const express = require('express');
const router= express.Router()
const FaqController = require('../Controller/FaqController.js');
router.get('/', FaqController.getFaq);

router.post('/add', FaqController.addFaq);
router.put('/update/:id', FaqController.updateFaq);
router.delete('/delete/:id', FaqController.deleteFaq);
module.exports=router