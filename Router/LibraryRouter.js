const express=require('express');
const router=express.Router();
const LibraryController = require('../Controller/LibraryController.js')
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

router.post('/add', upload.single('file_book'),LibraryController.addLibrary)
router.get('/',LibraryController.getLibrary)
router.get('/:filename', LibraryController.getByFile);
router.get('/getbydep/:id', LibraryController.getByDepartment); // Use :id in the route definition
router.put('/update/:id', upload.single('file_book'),LibraryController.updateLibrary)
router.delete('/delete/:id',LibraryController.deleteBook)

module.exports =router