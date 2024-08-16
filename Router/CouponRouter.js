const express = require('express');
const router= express.Router()
const CouponController = require('../Controller/CouponController');
router.get('/', CouponController.getCoupon);

router.post('/add', CouponController.addCoupon);
router.put('/update/:id', CouponController.updateCoupon);
router.delete('/delete/:id', CouponController.deleteCoupon);
module.exports=router