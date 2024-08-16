const express = require('express');
const router= express.Router();
const AboutController = require('../Controller/AboutController.js');
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

router.get('/', AboutController.getAbout);
router.put('/update/:id',upload.fields([{ name: 'img', maxCount: 1 }]), AboutController.updateAbout);



module.exports =router