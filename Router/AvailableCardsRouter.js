const express = require('express');
const AvailableCards= require('../Controller/AvailableCards.js');

const router = express.Router();

router.get('/:governorate_id',AvailableCards.getavailableCards);
router.get('/get/availablecard',AvailableCards.getAllavailableCards);
router.post('/add/availablecard',AvailableCards.postAvailableCards);
router.put('/update/availablecard/:id',AvailableCards.updateAvailableCards);
router.delete('/delete/availablecards/:id', AvailableCards.deleteAvailableCards);


router.get('/', AvailableCards.getgovernorate);
router.post('/add', AvailableCards.postGovernorate);
router.delete('/delete/:id', AvailableCards.deleteGovernorate);


module.exports = router;