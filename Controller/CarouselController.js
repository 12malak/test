const asyncHandler=require('../Middleware/asyncHandler.js');
const db=require('../config.js')
const addSliders= asyncHandler(async(req,res)=>{
    const {title, descr, page} = req.body
    const img = req.files && req.files["img"] ? req.files["img"][0].filename : null;
    const slider_img =req.files["slider_img"][0].filename;

    if (!page || !slider_img) {
        return res.status(400).send({
          error: "Please fill all required fields",
          message: "Title cannot be null or empty",
        });
      }
    const sqlInsert = "INSERT INTO slider (title, descr, img, page, slider_img) VALUES (?,?,?,?,?)";
    db.query(sqlInsert, [title, descr, img, page, slider_img], (err, result) => {
        if (err) {
            console.error('Error inserting data: ', err.message);
            return res.json({ message: "Error" });
        }
        res.json({ message: "Slider added successfully", data: result});
    });
 });
 const getSliders=asyncHandler(async(req,res)=>{
    const sqlSelect = "SELECT * FROM slider";
    db.query(sqlSelect, (err, result) => {
        if (err) {
            console.error('Error getting data: ', err.message);
            return res.json({ message: "Error" });
        }
        res.json(result);
    });
 })
 const getSliderByPage=asyncHandler(async(req,res)=>{
    const {page}=req.params
    const sqlSelect = "SELECT * FROM slider WHERE page = ?";
    db.query(sqlSelect,[page], (err, result) => {
        if (err) {
            console.error('Error selecting data: ', err.message);
            return res.json({ message: "Error" });
        }
        res.json(result);
    });
 })
 const updateSlider = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, descr } = req.body;

    // Check if files are present
    const img = req.files && req.files["img"] ? req.files["img"][0].filename : null;
    const slider_img = req.files && req.files["slider_img"] ? req.files["slider_img"][0].filename : null;

    // Validate required fields
    if (!id) {
        return res.status(400).json({ message: "Title, description, and ID are required." });
    }

    // Ensure at least one image file is provided
    if (!slider_img) {
        return res.status(400).json({ message: "At least one image file (img or slider_img) is required." });
    }

    // Construct SQL query based on provided fields
    const sqlUpdate = `
        UPDATE slider
        SET title = ?, descr = ?, img = ?, slider_img = ?
        WHERE page = ?`;

    db.query(sqlUpdate, [title, descr, img, slider_img, id], (err, result) => {
        if (err) {
            console.error('Error updating data: ', err.message);
            return res.status(500).json({ message: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        res.status(200).json({ message: 'Slider updated successfully' });
    });
});
const deleteSlide=asyncHandler(async(req,res)=>{
    const {id}=req.params
    const sqlDelete = 'DELETE FROM slider WHERE id =?';
    db.query(sqlDelete,[id],(err,result)=>{
        if(err){
            return res.json({message:err.message})
        }
        res.status(200).json({message: 'Slider deleted successfully'})
    })
 
})
module.exports={addSliders,getSliderByPage,updateSlider,getSliders,deleteSlide}