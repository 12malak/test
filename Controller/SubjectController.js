const db = require("../config.js");
const asyncHandler = require("../Middleware/asyncHandler.js");


const addCourse = asyncHandler(async (req, res) => {
    const subject_name = req.body.subject_name;
    const files = req.files; // Array of files uploaded by multer
    const title = req.body.title; // Array of title sent from form data

    try {
        // Insert all videos with title
        const insertVideoQuery = 'INSERT INTO videos (course_id, url, title) VALUES ?';
        const videoValues = files.map((file, index) => [null, file.filename, title[index]]); // courseId is set to null initially

        const videoInsertResult = await new Promise((resolve, reject) => {
            db.query(insertVideoQuery, [videoValues], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Retrieve all inserted video IDs
        const videoIds = videoInsertResult.insertId;

        // Insert the course details
        const insertCourseQuery = 'INSERT INTO courses (course_name) VALUES (?)';
        const courseInsertResult = await new Promise((resolve, reject) => {
            db.query(insertCourseQuery, [subject_name], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const courseId = courseInsertResult.insertId;

        // Update each video with the corresponding courseId
        const updateVideosQuery = 'UPDATE videos SET course_id = ? WHERE id = ?';
        const updatePromises = videoIds.map((videoId) => {
            return new Promise((resolve, reject) => {
                db.query(updateVideosQuery, [courseId, videoId], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });

        // Execute all update queries
        await Promise.all(updatePromises);

        res.status(201).json({ message: "Course and videos added successfully", courseId });
    } catch (error) {
        console.error('Error adding course and videos:', error);
        res.status(500).json({ message: "Error adding course and videos" });
    }
});

module.exports = {
    addCourse
};


module.exports = { addCourse };
