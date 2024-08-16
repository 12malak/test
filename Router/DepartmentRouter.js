const express = require('express');
const router= express.Router()
const DepartmentController = require('../Controller/DepartmentController.js');
router.get('/', DepartmentController.getDepartment);

router.post('/add', DepartmentController.addDepartment);
router.put('/update/:id', DepartmentController.updateDepartment);
router.delete('/delete/:id', DepartmentController.deleteDepartment);
module.exports=router