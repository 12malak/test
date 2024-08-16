const express = require('express');
const router= express.Router();
const BlogController = require('../Controller/BlogController.js');
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({
    storage: storage
})

router.post('/add',upload.fields([{ name: 'img', maxCount: 1 }]), BlogController.addBlog);
router.get('/', BlogController.getBlogs);
router.get('/lastthree', BlogController.getLastThreeBlogs);
router.get('/blogdetails/:id', BlogController.getBlogById);
// router.put('/update/:id',upload.fields([{ name: 'img', maxCount: 1 }]), BlogController.updateBlog);
router.put('/updateblogandtag/:id',upload.fields([{ name: 'img', maxCount: 1 }]), BlogController.updateBlogAndTag);
router.put('/action/:id', BlogController.updateActionBlogs);
router.delete('/delete/:id', BlogController.deleteBlog);


module.exports =router