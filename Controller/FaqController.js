const asyncHandler = require("../Middleware/asyncHandler.js");
const db = require("../config.js");

const addFaq = asyncHandler(async (req, res) => {
  const { ques, ans } = req.body;
  const sqlInsert = "INSERT INTO faq (ques , ans) VALUES (? , ?)";
  db.query(sqlInsert, [ques, ans], (err, result) => {
    if (err) {
        console.error('Error inserting data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res
      .status(201)
      .json({ message: "faq added successfully" });  });
});
const getFaq = asyncHandler(async (req, res) => {
    const sqlSelect = "SELECT * FROM faq";
    db.query(sqlSelect, (err, result) => {
      if (err) {
        console.error('Error selecting data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res.status(201).json(result);
    });
})
const updateFaq = asyncHandler(async (req, res) => {
    const id=req.params.id;
    const {ques, ans } = req.body;
    const sqlUpdate = "UPDATE faq SET ques =?, ans =? WHERE id =?";
    db.query(sqlUpdate, [ques, ans, id], (err, result) => {
      if (err) {
        console.error('Error updating data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res.status(201).json({ message: "faq updated successfully" });
    });
})
const deleteFaq=asyncHandler(async(req,res)=>{
    const id=req.params.id;
    const sqlDelete = "DELETE FROM faq WHERE id =?";
    db.query(sqlDelete, [id], (err, result) => {
      if (err) {
        console.error('Error deleting data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res.status(201).json({ message: "faq deleted successfully" });
    });  });

module.exports={addFaq,getFaq,updateFaq,deleteFaq}