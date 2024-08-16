const express = require('express');
const router= express.Router();
const CommentBlogController = require("../Controller/CommentBlogController.js");

router.post('/add', CommentBlogController.addCommentBlog);
router.get('/', CommentBlogController.getCommentBlog);
router.put('/commentblogaction/:id', CommentBlogController.updateActionCommentBlogs);

router.delete('/delete/:id', CommentBlogController.deleteCommentBlog);
module.exports = router;