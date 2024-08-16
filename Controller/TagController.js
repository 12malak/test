const asyncHandler = require('../Middleware/asyncHandler.js');
const db=require('../config.js')

// const getTag= asyncHandler(async(req,res)=>{
//     const sqlSelect = `
//            SELECT tag.*, blog.title AS title,
//            blog.author AS author,
//            blog.descr AS descr,
//            blog.img AS img,
//             DATE_FORMAT(blog.created_at, '%Y-%m-%d') AS created_date 
//             FROM tag
//             JOIN blog ON tag.blog_id =blog.id
//         `;    db.query(sqlSelect,(err,result)=>{
//         if(err){
//             return res.json({message: 'Error'})
//         }
//         res.status(200).json(result)
//     })
 
// })

// const getTag= asyncHandler(async(req,res)=>{
//     const sql = 'SELECT DISTINCT id FROM tag';
  
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error('Error fetching tags:', err);
//       return res.status(500).send({
//         error: 'Failed to fetch tags',
//         message: err.message,
//       });
//     }
//     res.send(results);
//   });
 
// })

const getUniqueTags = asyncHandler(async (req, res) => {
    const sqlSelect = `
        SELECT DISTINCT tag_name
        FROM tag
    `;
    
    db.query(sqlSelect, (err, result) => {
        if (err) {
            console.error('Error fetching tags:', err);
            return res.status(500).json({ message: 'Error fetching tags' });
        }
        res.status(200).json(result);
    });
});

const getBlogsByTag = asyncHandler(async (req, res) => {
    const tag_name = req.params.tag_name; // Get the tag ID from the request parameters
    const sqlSelect = `
        SELECT blog.id AS blog_id, blog.title, blog.author, blog.descr, blog.img, 
               DATE_FORMAT(blog.created_at, '%Y-%m-%d') AS created_date, 
               tag.tag_name AS tag_name
        FROM blog
        JOIN tag ON blog.id = tag.blog_id
        WHERE tag.tag_name = ?
    `;
    db.query(sqlSelect, [tag_name], (err, result) => {
        if (err) {
            return res.json({ message: 'Error fetching blogs' });
        }
        res.status(200).json(result);
    });
});

const getTagById= asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const sqlSelect = 'SELECT * FROM tag WHERE id = ?';
    db.query(sqlSelect,[id],(err,result)=>{
        if(err){
            return res.json({message: err.message})
        }
        res.status(200).json(result)
    })
 
})
module.exports = {getTagById,getUniqueTags,getBlogsByTag}
