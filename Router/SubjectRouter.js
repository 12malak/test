// SubjectController.js

const express = require('express');
const router = express.Router();
const SubjectController = require('../Controller/SubjectController');
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

// Route to add a course with videos
router.post('/addcourse', upload.array('videos', 10), SubjectController.addCourse);


module.exports = router;
