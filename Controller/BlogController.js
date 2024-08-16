const asyncHandler = require('../Middleware/asyncHandler.js');
const db=require('../config.js')

const addBlog = asyncHandler(async (req, res) => {
    const { title, author, descr, department_id, tags } = req.body; // tags can be a single string or an array of strings
    const img = req.files["img"][0].filename;
  const action="not approved"
    if (!title) {
      return res.status(400).send({
        error: "Failed to add blog",
        message: "Title cannot be null or empty",
      });
    }
  
    // Insert the blog into the blog table
    const blogSql = 'INSERT INTO blog (title, author, descr, img, action, department_id) VALUES (?, ?, ?, ?, ?, ?)';
  
    db.query(blogSql, [title, author, descr, img, action, department_id], (err, result) => {
      if (err) {
        console.error("Failed to add blog:", err);
        return res.status(500).send({
          error: "Failed to add blog",
          message: err.message,
        });
      }
  
      const id = result.insertId;
  
      // Normalize tags to always be an array
      let tagValues = [];
      if (tags) {
        if (Array.isArray(tags)) {
          // If tags is an array, process each tag
          tagValues = tags.map(tag => [id, tag]);
        } else {
          // If tags is a single value, convert it to an array
          tagValues = [[id, tags]];
        }
  
        // Insert tags into the tag table
        const tagSql = "INSERT INTO tag (blog_id, tag_name) VALUES ?";
        db.query(tagSql, [tagValues], (err, result) => {
          if (err) {
            console.error("Failed to add tags:", err);
            return res.status(500).send({
              error: "Failed to add tags",
              message: err.message,
            });
          }
  
          res.send({
            message: "Blog added successfully with tags",
          });
        });
      } else {
        // If no tags are provided, just return a success message for the blog
        res.send({
          message: "Blog added successfully, but no tags provided",
        });
      }
    });
  });
  
  


const getBlogs= asyncHandler(async(req,res)=>{
  const sqlSelect = `
    SELECT blog.*, 
           department.title AS department_name,
           GROUP_CONCAT(tag.tag_name SEPARATOR ', ') AS tag_name,
           DATE_FORMAT(blog.created_at, '%Y-%m-%d') AS created_date
    FROM blog
    JOIN department ON blog.department_id = department.id
    LEFT JOIN tag ON tag.blog_id = blog.id
    GROUP BY blog.id
`;

    db.query(sqlSelect,(err,result)=>{
        if(err){
            return res.json({message: 'Error'})
        }
        res.status(200).json(result)
    })
 
})
const getLastThreeBlogs = asyncHandler(async (req, res) => {
    const sqlSelect = `
       SELECT * FROM blog ORDER BY created_at DESC LIMIT 3`;
    db.query(sqlSelect, (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
     
        
        res.status(200).json(result);
        
    });
});

const getBlogById = asyncHandler(async (req, res) => {
    const {id} = req.params; // Assuming blog id is passed as a parameter
    const sqlSelect = `
    SELECT blog.*, 
           department.title AS department_name,
           tag.tag_name AS tag_name,
           DATE_FORMAT(blog.created_at, '%Y-%m-%d') AS created_date
    FROM blog
    JOIN department ON blog.department_id = department.id
    JOIN tag ON tag.blog_id = blog.id
    WHERE blog.id = ?
  `;
  
    db.query(sqlSelect, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
  
      res.status(200).json(result);
    });
  });
  


const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, author, descr, tag_id, department_id } = req.body;
 // Check if any required fields are missing
 if (!title || !author || !descr || !tag_id || !department_id || !req.files || !req.files['img']) {
    return res.status(400).json({ message: "All fields (title, author, descr, tag_id, department_id, img) are required." });
}
    const img = req.files['img'][0].filename;

    const sqlUpdate = 'UPDATE blog SET title = ?, author = ?, descr = ?, tag_id = ?, department_id = ?, img = ? WHERE id = ?';
    db.query(sqlUpdate, [title, author, descr, tag_id, department_id, img, id], (err, result) => {
        if (err) {
            console.error('Error updating data: ' + err.message);
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json({ message: 'Blog updated successfully' });
    });
});

const updateBlogAndTag = asyncHandler(async (req, res) => {
  const { title, author, descr, department_id, tags } = req.body; // tags can be a single string or an array of strings
  const img = req.files["img"][0].filename;
  const action = "not approved";
  const id = req.params.id; // Assuming you are passing the blog ID in the request parameters

  if (!title) {
    return res.status(400).send({
      error: "Failed to add blog",
      message: "Title cannot be null or empty",
    });
  }

  // Update the blog in the blog table
  const blogSql = `UPDATE blog 
                   SET title = ?, author = ?, descr = ?, department_id = ?, img = ?, action = ? 
                   WHERE id = ?`;

  db.query(blogSql, [title, author, descr, department_id, img, action, id], (err, result) => {
    if (err) {
      console.error("Failed to update blog:", err);
      return res.status(500).send({
        error: "Failed to update blog",
        message: err.message,
      });
    }

    // Process tags
    if (tags) {
      // Normalize tags to always be an array
      let tagValues = [];
      if (Array.isArray(tags)) {
        tagValues = tags.map(tag => [id, tag]);
      } else {
        tagValues = [[id, tags]];
      }

      // Remove old tags
      const deleteTagsSql = "DELETE FROM tag WHERE blog_id = ?";
      db.query(deleteTagsSql, [id], (err, result) => {
        if (err) {
          console.error("Failed to delete old tags:", err);
          return res.status(500).send({
            error: "Failed to update tags",
            message: err.message,
          });
        }

        // Insert new tags
        const insertTagsSql = "INSERT INTO tag (blog_id, tag_name) VALUES ?";
        db.query(insertTagsSql, [tagValues], (err, result) => {
          if (err) {
            console.error("Failed to insert new tags:", err);
            return res.status(500).send({
              error: "Failed to update tags",
              message: err.message,
            });
          }

          res.send({
            message: "Blog updated successfully with tags",
          });
        });
      });
    } else {
      // If no tags are provided, just return a success message for the blog
      res.send({
        message: "Blog updated successfully, but no tags provided",
      });
    }
  });
});


const updateActionBlogs =asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const { action } = req.body;

    if (!action) {
        return res.status(400).send({ error: 'action is required' });
    }

    const updateBlogSql = 'UPDATE blog SET action = ? WHERE id = ?';
    db.query(updateBlogSql, [action, id], (err, result) => {
        if (err) {
            console.error('Failed to update blog status:', err);
            return res.status(500).send({ error: 'Failed to update blog status' });
        }

        res.status(200).send({ message: 'Blog status updated successfully' });
    });
})
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).send({
            error: "Failed to delete tag and possibly blog",
            message: "Blog ID and tag name cannot be null or empty",
        });
    }
    // Delete the tag
    const deleteTagSql = 'DELETE FROM tag WHERE blog_id = ?';
    db.query(deleteTagSql, [id], (err, result) => {
        if (err) {
            console.error("Failed to delete tag:", err);
            return res.status(500).send({
                error: "Failed to delete tag",
                message: err.message,
            });
        }
        // Check if there are any other tags left for this blog
        const checkTagsSql = 'SELECT COUNT(*) AS tagCount FROM tag WHERE blog_id = ?';
        db.query(checkTagsSql, [id], (err, results) => {
            if (err) {
                console.error("Failed to check remaining tags:", err);
                return res.status(500).send({
                    error: "Failed to check remaining tags",
                    message: err.message,
                });
            }
            const deletecommentblogSql = 'DELETE FROM commentblog WHERE blog_id = ?';
    db.query(deletecommentblogSql, [id], (err, result) => {
        if (err) {
            console.error("Failed to delete tag:", err);
            return res.status(500).send({
                error: "Failed to delete tag",
                message: err.message,
            });
        }
            // If no other tags are left, delete the blog
            if (results[0].tagCount === 0) {
                const deleteBlogSql = 'DELETE FROM blog WHERE id = ?';
                db.query(deleteBlogSql, [id], (err, result) => {
                    if (err) {
                        console.error("Failed to delete blog:", err);
                        return res.status(500).send({
                            error: "Failed to delete blog",
                            message: err.message,
                        });
                    }

                    res.send({
                        message: "Tag deleted successfully and blog removed (if no other tags left)",
                    });
                });
            } else {
                res.send({
                    message: "Tag deleted successfully",
                });
            }
          })
        });
    });
});

module.exports={addBlog,getBlogs,updateBlog,deleteBlog, getLastThreeBlogs,getBlogById,updateActionBlogs,updateBlogAndTag}