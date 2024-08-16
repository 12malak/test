const express = require('express');
const asyncHandler=require("../Middleware/asyncHandler.js")
const db = require("../config.js");
const { register, login } = require('../Middleware/verifyJWT');
const router = express.Router();
const User = require('../Controller/UserController.js'); // Import UserController
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

router.post('/register',upload.single('img'), register);
router.post('/login', login);


router.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    User.findById(userId, (err, user) => {
      if (err) return res.status(500).send(err);
      if (!user) return res.status(404).send('User not found');
      res.status(200).json(user);
    });
  });

router.get('/getusers',asyncHandler(async (req, res) => {
   
        const sqlSelect = "SELECT * FROM users";
        db.query(sqlSelect, (err, result) => {
          if (err) {
            console.error('Error selecting data: ' + err.message);
            return res.json({ message: "Error" });
          }
          res.status(201).json(result);
        });
      })
)
module.exports = router;
