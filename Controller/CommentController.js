const db = require("../config.js");
const asyncHandler=require("../Middleware/asyncHandler.js")
const addComment = (req, res) => {
  const { name, email, comment } = req.body;
  const action = "not aprroved";
  if (!name || !email || !comment) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql =
    "INSERT INTO comments (name, email, comment, action) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, comment, action], (err, result) => {
    if (err) {
      console.error("Error inserting comment:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Comment submitted successfully", result });
  });
};

const getComments = (req, res) => {
  const sql = `
  SELECT comments.*,
  DATE_FORMAT(comments.created_at, '%Y-%m-%d') AS created_date 
  FROM comments
`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching comments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};
const updateActionComments =asyncHandler(async(req,res)=>{
  const { id } = req.params;
  const { action } = req.body;

  if (!action) {
      return res.status(400).send({ error: 'action is required' });
  }

  const updateBlogSql = 'UPDATE comments SET action = ? WHERE id = ?';
  db.query(updateBlogSql, [action, id], (err, result) => {
      if (err) {
          console.error('Failed to update comments status:', err);
          return res.status(500).send({ error: 'Failed to update comments status' });
      }

      res.status(200).send({ message: 'comments status updated successfully' });
  });
})
const deleteComment= asyncHandler(async (req, res) => {
  const {id}=req.params;
  const sqlDelete = 'DELETE FROM comments WHERE id =?';
  db.query(sqlDelete,[id],(err,result)=>{
      if(err){
          return res.json({message:err.message})
      }
      res.status(200).json({message: 'Comment deleted successfully'})
  })
})
module.exports = { addComment, getComments,updateActionComments,deleteComment };
