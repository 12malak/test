const db = require("../config.js");
const asyncHandler = require("../Middleware/asyncHandler.js");
const getAbout=asyncHandler(async(req,res)=>{
    const sqlSelect = `SELECT * FROM about`
    db.query(sqlSelect, (err, result) => {
        if (err) {
            console.error('Error executing query: ' + err.message);
            return res.status(500).send("Server Error");
        }
        res.json(result);
    });
    
})
const updateAbout = asyncHandler(async(req, res)=>{
    const {id}=req.params;
    const {title, descr}=req.body;
    const img = req.files['img'][0].filename;
    if (!title || !img || !descr) {
        return res.status(400).json({ message: "All fields (title, descr, img) are required." });
    }
    const sqlUpdate = `UPDATE about SET title=?, descr=?, img=? WHERE id=?`
    db.query(sqlUpdate, [title, descr, img, id], (err, result) => {
        if (err) {
            console.error('Error executing query: ' + err.message);
            return res.status(500).send("Server Error");
        }
        res.json({message: "About Updated Successfully"});
    });
    
 
})
module.exports = {getAbout,updateAbout}