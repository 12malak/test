const express = require('express');
const router = express.Router();
const courseController = require('../Controller/Payment-CourseController.js')



router.post('/courses', courseController.buyCourse);
router.post('/validate', courseController.validateCouponCode);
router.get('/getApprovedCoursesForUser/:user_id',courseController.getApprovedCoursesForUser);


module.exports = router;