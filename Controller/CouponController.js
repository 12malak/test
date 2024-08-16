const asyncHandler = require("../Middleware/asyncHandler.js");
const db = require("../config.js");

const addCoupon = asyncHandler(async (req, res) => {
  const { coupon_code } = req.body;
  const used ='0'
  const sqlInsert = "INSERT INTO coupons (coupon_code, used) VALUES (?, ?)";
  db.query(sqlInsert, [coupon_code, used], (err, result) => {
    if (err) {
        console.error('Error inserting data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res
      .status(201)
      .json({ message: "coupon added successfully", id: result.insertId });  });
});
const getCoupon = asyncHandler(async (req, res) => {
    const sqlSelect = "SELECT * FROM coupons";
    db.query(sqlSelect, (err, result) => {
      if (err) {
        console.error('Error selecting data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res.status(201).json(result);
    });
})
const updateCoupon = asyncHandler(async (req, res) => {
    const id=req.params.id;
    const { coupon_code } = req.body;
    const used ='0'
    const sqlUpdate = "UPDATE coupons SET coupon_code =? , used =? WHERE id =?";
    db.query(sqlUpdate, [coupon_code, used, id], (err, result) => {
      if (err) {
        console.error('Error updating data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res.status(201).json({ message: "coupon updated successfully" });
    });
})
const deleteCoupon=asyncHandler(async(req,res)=>{
    const id=req.params.id;
    const sqlDelete = "DELETE FROM coupons WHERE id =?";
    db.query(sqlDelete, [id], (err, result) => {
      if (err) {
        console.error('Error deleting data: ' + err.message);
        return res.json({ message: "Error" });
      }
      res.status(201).json({ message: "coupon deleted successfully" });
    });  });

module.exports ={addCoupon,getCoupon,updateCoupon,deleteCoupon}