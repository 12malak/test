const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ProfileController = require('../Controller/ProfileController');
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

router.get('/profile/:id', ProfileController.getProfile);
router.put('/profile/:id',upload.single('img'), ProfileController.updateProfile);
module.exports = router;
