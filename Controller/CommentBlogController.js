const asyncHandler=require('../Middleware/asyncHandler.js');
const db=require('../config.js')

const addCommentBlog=asyncHandler(async(req,res)=>{
    const {name,email,comment,blog_id}=req.body;
    const defaultAction = 'not approved'; // Replace with your default action value

    const sqlInsert = 'INSERT INTO commentblog (name, email, comment, blog_id, action) VALUES (?, ?, ?, ?, ?)';
    db.query(sqlInsert,[name,email,comment,blog_id,defaultAction
        
    ],(err,result)=>{
        if(err){
            return res.json({message:err.message})
        }
        res.status(200).json({message: ' Blog Comment added successfully'})
    })
})
const getCommentBlog = asyncHandler(async (req, res) => {
    // Fetch data from blog and department tables to return department name
    const sqlSelect = `
       SELECT commentblog.*,blog.title AS blog_name,
        DATE_FORMAT(commentblog.created_at, '%Y-%m-%d') AS created_date 
        FROM commentblog
        JOIN blog ON commentblog.blog_id = blog.id
    `;
    
    db.query(sqlSelect, (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
     
        
        res.status(200).json(result);

    });
});
const updateActionCommentBlogs =asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const { action } = req.body;

    if (!action) {
        return res.status(400).send({ error: 'action is required' });
    }

    const updateBlogSql = 'UPDATE commentblog SET action = ? WHERE id = ?';
    db.query(updateBlogSql, [action, id], (err, result) => {
        if (err) {
            console.error('Failed to update blog status:', err);
            return res.status(500).send({ error: 'Failed to update blog status' });
        }

        res.status(200).send({ message: 'Blog status updated successfully' });
    });
})
const deleteCommentBlog = asyncHandler(async (req, res) => {
    const {id}=req.params;
    const sqlDelete = 'DELETE FROM commentblog WHERE id =?';
    db.query(sqlDelete,[id],(err,result)=>{
        if(err){
            return res.json({message:err.message})
        }
        res.status(200).json({message: 'Blog Comment deleted successfully'})
    })
})
module.exports = {addCommentBlog,getCommentBlog,deleteCommentBlog,updateActionCommentBlogs}
