const express = require('express');
const router= express.Router();
const CommentCourseController = require("../Controller/CommentCourseController.js");

router.post('/add', CommentCourseController.addCommentCourse);
router.get('/', CommentCourseController.getCommentcourse);
router.put('/action/:id', CommentCourseController.updateActionCommentCourse);
router.delete('/delete/:id', CommentCourseController.deleteCommentcourse);
module.exports = router;