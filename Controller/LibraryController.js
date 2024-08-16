const asyncHandler=require('../Middleware/asyncHandler.js')
const db=require('../config.js');
const path = require('path');
const addLibrary = asyncHandler(async (req, res) => {
    const { book_name, author, page_num, department_id } = req.body;
        if (!book_name || !author || !page_num || !department_id || !req.file) {
        return res.status(400).json({ message: "All fields (book_name, author, page_num, department_id, file_book) are required." });
    }
    const file_book = req.file.filename;

    const sqlInsert = 'INSERT INTO library (book_name, author, page_num, file_book, department_id) VALUES (?, ?, ?, ?, ?)';
    db.query(sqlInsert, [book_name, author, page_num, file_book, department_id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'Library added successfully' });
    });
});

const getLibrary = asyncHandler(async(req,res)=>{
    const sqlSelect = `
       SELECT library.*, department.title AS department_name,
        DATE_FORMAT(library.created_at, '%Y-%m-%d') AS created_date 
        FROM library
        JOIN department ON library.department_id = department.id
    `;
    
    db.query(sqlSelect,(err,result)=>{
        if(err){
            res.download(`../images/${result.file_book}`)
            return res.json({message: err.message})
        }
        res.json(result)
    })
})
//get the file and download it
const getByFile = (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, '../images', fileName); 

    res.download(filePath, fileName, (err) => {
        if (err) {
            res.status(500).json({ message: 'File download failed' });
        } else {
            res.status(200).json({ message: 'File downloaded successfully' });
        }
    });
};
//get all library by department
const getByDepartment = (req, res) => {
    const department_id = req.params.id; // Access id from req.params
    const sqlSelect = `
        SELECT library.*, department.title AS department_name,
        DATE_FORMAT(library.created_at, '%Y-%m-%d') AS created_date
        FROM library
        JOIN department ON library.department_id = department.id
        WHERE library.department_id = ?
    `;
    
    db.query(sqlSelect, [department_id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.json(result);
    });
};
const updateLibrary = asyncHandler(async(req,res)=>{
    const { book_name, author, page_num, department_id } = req.body;
    const id=req.params.id;
    const file_book = req.file.filename;

    if (!book_name ||!author ||!page_num ||!department_id || !req.file) {
        return res.status(400).json({ message: "All fields (book_name, author, page_num,file_book, department_id) are required." });
    }
    const sqlUpdate = 'UPDATE library SET book_name=?, author=?, page_num=?, department_id=?, file_book=? WHERE id=?';
    db.query(sqlUpdate, [book_name, author, page_num, department_id,file_book, id], (err,result)=>{
        if(err){
            return res.json({message: err.message})
        }
        res.status(200).json({message: 'Library updated successfully'})
    })
})
const deleteBook=asyncHandler(async(req,res)=>{
    const id=req.params.id;
    const sqlDelete = "DELETE FROM library WHERE id =?";
    db.query(sqlDelete, [id], (err, result) => {
        if (err) {
            return res.json({ message: err.message });
        }
        res.status(200).json({ message: "Library deleted successfully" });
    });
})
module.exports={addLibrary,getLibrary,updateLibrary,deleteBook,getByFile,getByDepartment}