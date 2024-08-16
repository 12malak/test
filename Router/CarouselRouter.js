const express = require('express');
const router= express.Router();
const CarouselController = require('../Controller/CarouselController.js');
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

router.post('/add',upload.fields([{ name: 'img', maxCount: 1 },{ name: 'slider_img', maxCount: 1 }]), CarouselController.addSliders);
router.get('/:page', CarouselController.getSliderByPage);
router.get('/', CarouselController.getSliders);
router.put('/update/:id',upload.fields([{ name: 'img', maxCount: 1 },{ name: 'slider_img', maxCount: 1 }]), CarouselController.updateSlider);
router.delete('/delete/:id', CarouselController.deleteSlide);



module.exports =router