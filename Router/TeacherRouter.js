const express = require('express');
const router= express.Router();
const TeacherController = require('../Controller/TeacherController.js');
const multer = require("multer");
const path = require('path');

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Retain original filename and extension
  }
});

const upload = multer({ storage: storage });

// Make sure the name specified here matches the field name in the form
router.post('/add', upload.fields([{ name: 'img', maxCount: 1 }]), TeacherController.addTeacherAndcourses);
router.post('/addcourseteacher', upload.fields([{ name: 'img', maxCount: 1 },{ name: 'defaultvideo', maxCount: 1 },{ name: 'url', maxCount: 30 }]), TeacherController.teacherAddCourse);
router.put('/updatecourseteacher/:courseId', upload.fields([{ name: 'img', maxCount: 1 },{ name: 'defaultvideo', maxCount: 1 },{ name: 'url', maxCount: 30 }]), TeacherController.updateTeacherCourse);
router.delete('/deletecourseteacher/:id', TeacherController.deleteTeacherCourse);

router.get('/', TeacherController.getTeacher);
router.get('/student-counts/:id',TeacherController.getStudentCountForTeacher);
router.get('/:id', TeacherController.getTeacherById);
router.get('/teachercourse/:id', TeacherController.getTeacherCourseById);
router.put('/update/:id',upload.fields([ { name: 'img', maxCount: 1 }]), TeacherController.updateTeacher);
router.delete('/delete/:id', TeacherController.deleteTeacher);

module.exports=router