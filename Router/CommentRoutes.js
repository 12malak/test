   
const express = require("express");
const router = express.Router();
const { addComment , getComments, updateActionComments,deleteComment} = require("../Controller/CommentController");

router.post("/comments", addComment);
router.get("/comment", getComments);
router.put("/action/:id", updateActionComments);
router.delete('/delete/:id', deleteComment);

module.exports = router;