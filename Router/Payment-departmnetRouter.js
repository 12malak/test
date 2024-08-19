const express = require('express');
const router = express.Router();
const departmentController = require('../Controller/Payment-departmentController');

router.get('/departments', departmentController.getDepartments);
router.post('/buy', departmentController.buyDepartment);
router.get('/get', departmentController.getPayments);
router.get('/getcourseusers', departmentController.getCourseUsers);
router.get('/getallcourseusers', departmentController.getJustCourseUser);
router.put('/payments/:id/approve', departmentController.updateStatusPayments);
router.delete('/delete/payments/:payment_id', departmentController.deleteCourseUsers);
router.post('/validateCoupon', departmentController.validateCouponCode);
module.exports = router;
