const express = require('express');
const router=express.Router();
const TagController=require('../Controller/TagController.js')

// router.get('/', TagController.getTag);
router.get('/gettagbyid/:id', TagController.getTagById);
router.get('/uniquetag', TagController.getUniqueTags);
router.get('/blogbytag/:tag_name', TagController.getBlogsByTag);


module.exports = router;