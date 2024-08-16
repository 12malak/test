// const asyncHandler = require("../Middleware/asyncHandler.js");
const db = require("../config.js");
const asyncHandler = require("../Middleware/asyncHandler.js");
const ffmpeg = require('fluent-ffmpeg');


const addTeacherAndcourses = async (req, res) => {
  const { teacher_name, descr,email, department_id } = req.body;
  
  // Check if the file and other fields are present
  if (!teacher_name || !descr || !email || !department_id || !req.files || !req.files['img']) {
    return res.status(400).json({ message: "All fields (teacher_name, descr, email, department_id, img) are required." });
  }

  // Ensure the 'img' field is an array and has at least one file
  const img = req.files['img'][0].filename;

  const sqlInsert = 'INSERT INTO teacher (teacher_name, descr, img, email, department_id) VALUES (?, ?, ?, ?, ?)';
  db.query(sqlInsert, [teacher_name, descr, img, email, department_id], (err, result) => {
    if (err) {
      console.error('Error inserting teacher data: ' + err.message);
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json({ message: 'Teacher added successfully' });
  });
};

  const getTeacherById=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    const sql="SELECT * FROM teacher WHERE id = ?";
    db.query(sql,[id],(err,result)=>{
      if(err){
        console.error('Error fetching teacher data: '+err.message);
        return res.status(500).json({message:"Error fetching teacher data"});
      }
      if(result.length===0){
        return res.status(404).json({message:"Teacher not found"});
      }
      return res.json(result[0]);
    })
  })

  const getTeacher = asyncHandler(async (req, res) => {
    const sql = `
      SELECT t.id, t.teacher_name, t.descr, t.img, t.department_id, d.title AS department_name
      FROM teacher t
      LEFT JOIN department d ON t.department_id =d.id
    `;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching teacher data: ' + err.message);
        return res.status(500).json({ message: "Error fetching teacher data" });
      }
      
      return res.json(results);
    });
  });
  function getVideoDurationInSeconds(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve(duration);
        }
      });
    });
  }
  const ffmpegPath =  './ffmpeg/bin/ffmpeg-6.1-win-64/ffmpeg'
const ffprobePath = './ffmpeg/bin/ffprobe-6.1-win-64/ffprobe'
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

  // Function to format seconds into hours, minutes, and seconds
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
  
    // Return the formatted duration
    return `${hours}h ${minutes}m ${secs}s`;
  }
  // Function to calculate total duration in seconds
  function calculateTotalDuration(durations) {
    return durations.reduce((total, duration) => total + duration, 0);
  }
  const teacherAddCourse = (req, res) => {
    const {
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      teacher_id,
      email,
    } = req.body;
  
    const img = req.files["img"] ? req.files["img"][0].filename : null;
    const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
    const links = req.body["link"] || [];
    const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);
  
    if (!subject_name) {
      return res.status(400).send({
        error: "Failed to add course",
        message: "Subject name cannot be null or empty",
      });
    }
  
    const checkCouponSql = 'SELECT id FROM teacher WHERE email = ?';
    db.query(checkCouponSql, [email], (err, results) => {
      if (err) {
        console.error("Error checking coupon:", err);
        return res.status(500).json({ error: "Database error" });
      }
  
      if (results.length === 0) {
        return res.status(400).json({ error: "Invalid email" });
      }
  
      const teachercId = results[0].id;
  
      const courseSql = `
        INSERT INTO Courses 
        (subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id, img, defaultvideo) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      db.query(courseSql, [
        subject_name,
        department_id,
        before_offer,
        after_offer,
        coupon,
        descr,
        std_num,
        rating,
        teachercId,
        img,
        defaultvideo,
      ], async (err, result) => {
        if (err) {
          console.error("Failed to add course:", err);
          return res.status(500).send({
            error: "Failed to add course",
            message: err.message,
          });
        }
  
        const courseId = result.insertId;
        const titles = req.body["title"] || [];
        const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];
        const normalizedTitles = Array.isArray(titles) ? titles : (titles ? [titles] : []);
  
        try {
          // Video data from uploaded files
          const videoFileData = videos.map((file) => ({
            filename: file.filename,
            type: 'file'
          }));
  
          // Video data from links
          const videoLinkData = normalizedLinks.map((link) => ({
            filename: link,
            type: 'link'
          }));
  
          const videoData = [...videoFileData, ...videoLinkData];
  
          // For file videos, get the duration if available
          const processedVideoData = await Promise.all(videoData.map(async (video) => {
            if (video.type === 'file') {
              const videoPath = `./images/${video.filename}`; // Adjust path as necessary
              const duration = await getVideoDurationInSeconds(videoPath);
              return {
                ...video,
                duration,
                link: null // No link for file videos
              };
            } else {
              return {
                ...video,
                duration: null,
                link: video.filename // Link stored in filename
              };
            }
          }));
  
          // Calculate total duration in seconds for files only
          const totalDurationInSeconds = calculateTotalDuration(processedVideoData
            .filter(v => v.type === 'file')
            .map(v => v.duration));
          const formattedTotalDuration = formatDuration(totalDurationInSeconds);
  
          // Prepare data for insertion
          const videoValues = processedVideoData.map((video, index) => [
            courseId,
            normalizedTitles[index] || "Untitled", // Provide default title if missing
            video.type === 'file' ? video.filename : '', // URL for files, empty string for links
            video.type === 'link' ? video.link : '', // Link for links, empty string for files
            video.type,
            formatDuration(video.duration || 0)
          ]);
  
          const videoSql = "INSERT INTO videos (course_id, title, url, link, type, duration) VALUES ?";
          db.query(videoSql, [videoValues], (err, result) => {
            if (err) {
              console.error("Failed to add videos:", err);
              return res.status(500).send({
                error: "Failed to add videos",
                message: err.message,
              });
            }
  
            const updateCourseSql = "UPDATE Courses SET total_video_duration = ? WHERE id = ?";
            db.query(updateCourseSql, [formattedTotalDuration, courseId], (err, result) => {
              if (err) {
                console.error("Failed to update course duration:", err);
                return res.status(500).send({
                  error: "Failed to update course duration",
                  message: err.message,
                });
              }
  
              res.send({
                message: "Course and videos added successfully",
                totalDuration: formattedTotalDuration,
              });
            });
          });
        } catch (error) {
          console.error("Failed to get video duration:", error);
          return res.status(500).send({
            error: "Failed to get video duration",
            message: error.message,
          });
        }
      });
    });
  };
  
  // const teacherAddCourse = (req, res) => {
  //   const {
  //     subject_name,
  //     department_id,
  //     before_offer,
  //     after_offer,
  //     coupon,
  //     descr,
  //     std_num,
  //     rating,
  //     teacher_id,
  //     email,
  //   } = req.body;
  
  //   const img = req.files["img"] ? req.files["img"][0].filename : null;
  //   const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
  
  //   if (!subject_name) {
  //     return res.status(400).send({
  //       error: "Failed to add course",
  //       message: "Subject name cannot be null or empty",
  //     });
  //   }
  
  //   const checkCouponSql = 'SELECT id FROM teacher WHERE email = ?';
  //   db.query(checkCouponSql, [email], (err, results) => {
  //     if (err) {
  //       console.error("Error checking coupon:", err);
  //       return res.status(500).json({ error: "Database error" });
  //     }
  
  //     if (results.length === 0) {
  //       return res.status(400).json({ error: "Invalid email" });
  //     }
  
  //     const teachercId = results[0].id;
  
  //     const courseSql =
  //       "INSERT INTO Courses (subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id, img, defaultvideo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  
  //     db.query(
  //       courseSql,
  //       [
  //         subject_name,
  //         department_id,
  //         before_offer,
  //         after_offer,
  //         coupon,
  //         descr,
  //         std_num,
  //         rating,
  //         teachercId,
  //         img,
  //         defaultvideo,
  //       ],
  //       async (err, result) => {
  //         if (err) {
  //           console.error("Failed to add course:", err);
  //           return res.status(500).send({
  //             error: "Failed to add course",
  //             message: err.message,
  //           });
  //         }
  
  //         const courseId = result.insertId;
  //         console.log("courseId",courseId)
  //         const titles = req.body["title"] || [];
  //         const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];
  //         const normalizedTitles = Array.isArray(titles) ? titles : (titles ? [titles] : []);

  //         if (videos.length > normalizedTitles.length) {
  //           normalizedTitles.push(...Array(videos.length - normalizedTitles.length).fill("Untitled"));
  //       }
  //         console.log("Titles:", titles);
  //         console.log("Videos:", videos);
          
  //         if (videos.length > 0) {
  //           try {
  //             const videoData = await Promise.all(videos.map(async (video, index) => {
  //               const videoPath = `./images/${video.filename}`;
  //               const duration = await getVideoDurationInSeconds(videoPath);
  //               return {
  //                 filename: video.filename,
  //                 duration
  //               };
  //             }));
  
  //             const totalDurationInSeconds = calculateTotalDuration(videoData.map(v => v.duration));
  //             const formattedTotalDuration = formatDuration(totalDurationInSeconds);
  
  //             const videoValues = videoData.map((video, index) => {
  //               const title = normalizedTitles[index] || "Untitled";
  //               console.log(`Processing video: ${video.filename} with title: ${title}`); // Debugging
  //               return [
  //                   courseId,
  //                   title,
  //                   video.filename,
  //                   formatDuration(video.duration),
  //               ];
  //           });
  //    console.log("Video Data:", videoData);

  //             const videoSql = "INSERT INTO videos (course_id, title, url, duration) VALUES ?";
  //             db.query(videoSql, [videoValues], (err, result) => {
  //               if (err) {
  //                 console.error("Failed to add videos:", err);
  //                 return res.status(500).send({
  //                   error: "Failed to add videos",
  //                   message: err.message,
  //                 });
  //               }
  //               console.log("Video Values for Insertion:", videoValues);
  
  //               const updateCourseSql = "UPDATE Courses SET total_video_duration = ? WHERE id = ?";
  //               db.query(updateCourseSql, [formattedTotalDuration, courseId], (err, result) => {
  //                 if (err) {
  //                   console.error("Failed to update course duration:", err);
  //                   return res.status(500).send({
  //                     error: "Failed to update course duration",
  //                     message: err.message,
  //                   });
  //                 }

  //                 res.send({
  //                   message: "Course and videos added successfully",
  //                   totalDuration: formattedTotalDuration,
  //                 });
  //               });
  //             });
  //           } catch (error) {
  //             console.error("Failed to get video duration:", error);
  //             return res.status(500).send({
  //               error: "Failed to get video duration",
  //               message: error.message,
  //             });
  //           }
  //         } else {
  //           res.send({
  //             message: "Course added successfully, but no videos provided",
  //             totalDuration: "0h 0m 0s",
  //           });
  //         }
  //       }
  //     );
  //   });
  // };
  

const getTeacherCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Corrected SQL query
  const sqlSelect = `
    SELECT courses.*,  
               department.title AS department_name,
           teacher.teacher_name AS teacher_name
    FROM courses
        LEFT JOIN department ON courses.department_id = department.id
    LEFT JOIN teacher ON courses.teacher_id = teacher.id
    WHERE teacher.email = ?`;

  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('Error fetching course data: ' + err.message);
      return res.status(500).json({ message: "Error fetching course data" });
    }
    res.status(200).json(result);
  });
});

  //update ****************
  const updateTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teacher_name, descr, department_id } = req.body;

    let img;

    // Check if the 'img' file exists in the request
    if (req.files && req.files.img && req.files.img[0]) {
        img = req.files.img[0].filename; 
    }

    // Fetch the current values of img
    const checkSql = 'SELECT img FROM teacher WHERE id = ?';
    db.query(checkSql, [id], (checkErr, checkResult) => {
        if (checkErr) {
            return res.json({ error: 'Error checking data' });
        }
        if (checkResult.length === 0) {
            return res.json({ error: 'No data found for the specified ID' });
        }

        const currentimg = checkResult[0].img;

        // Determine which image to update
        const updatedimg = img ? img : currentimg; // Use the new image if uploaded, otherwise retain the current one

        // Update only the text fields and respective image
        const sqlUpdateText = 'UPDATE teacher SET teacher_name = ?, descr = ?, department_id = ?, img = ? WHERE id = ?';
        db.query(sqlUpdateText, [teacher_name, descr, department_id, updatedimg, id], (updateErr, updateResult) => {
            if (updateErr) {
                return res.json({ error: 'Error updating data' });
            }
            // Now, img is defined and can be safely used here
            res.json({ id, teacher_name, descr, department_id, img: updatedimg });
        });
    });
});

// delete****************************
const deleteTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Delete related records in the courses table
    const deletecoursessSql = 'DELETE FROM courses WHERE teacher_id = ?';
    db.query(deletecoursessSql, [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
            console.error('Error deleting related coursess: ' + deleteErr.message);
            return res.status(500).json({ message: "Error deleting related coursess" });
        }
        const deleteteacher_studentSql = 'DELETE FROM teacher_students WHERE teacher_id = ?';
        db.query(deleteteacher_studentSql, [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error deleting related teacher student: ' + deleteErr.message);
                return res.status(500).json({ message: "Error deleting related coursess" });
            }
        // After deleting related coursess, delete the teacher record
        const deleteTeacherSql = 'DELETE FROM teacher WHERE id = ?';
        db.query(deleteTeacherSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting teacher data: ' + err.message);
                return res.status(500).json({ message: "Error deleting teacher data" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Teacher not found" });
            }

            return res.json({ message: "Teacher deleted successfully" });
          })
        });
    });
});

const getStudentCountForTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sqlSelect = `
     SELECT t.id,  COUNT(ts.student_id) AS student_count
    FROM teacher t
    JOIN teacher_students ts ON t.id = ts.teacher_id
    WHERE t.id = ?
    GROUP BY t.id;
  `;

  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('Failed to fetch student count for teacher:', err);
      return res.status(500).send({
        error: 'Failed to fetch student count for teacher',
        message: err.message,
      });
    }
    if (result.length === 0) {
      return res.status(404).send({
        message: 'No students found for this teacher',
      });
    }

    res.status(200).json(result[0]); // Return the first result object
  });
});
const updateTeacherCourse = asyncHandler(async (req, res) => {
  const {
    subject_name,
    department_id,
    before_offer,
    after_offer,
    coupon,
    descr,
    std_num,
    rating,
    email,
    title: titles = [] // Default to empty array if no titles are provided
  } = req.body;

  const img = req.files["img"] ? req.files["img"][0].filename : null;
  const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
  const links = req.body["link"] || [];
  const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);
  const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];

  // Get the course ID from URL parameters
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).send({
      error: "Course ID is required",
    });
  }

  // Check if the teacher exists
  const checkTeacherSql = 'SELECT id FROM teacher WHERE email = ?';
  db.query(checkTeacherSql, [email], async (err, results) => {
    if (err) {
      console.error("Error checking teacher:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const teacherId = results[0].id;

    // Update course details
    const updateCourseSql = `
      UPDATE Courses
      SET
        subject_name = ?,
        department_id = ?,
        before_offer = ?,
        after_offer = ?,
        coupon = ?,
        descr = ?,
        std_num = ?,
        rating = ?,
        teacher_id = ?,
        img = COALESCE(?, img),
        defaultvideo = COALESCE(?, defaultvideo)
      WHERE id = ?
    `;

    db.query(updateCourseSql, [
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      teacherId,
      img,
      defaultvideo,
      courseId
    ], async (err) => {
      if (err) {
        console.error("Failed to update course:", err);
        return res.status(500).send({
          error: "Failed to update course",
          message: err.message,
        });
      }

      // Normalize titles to an array if it's a single value
      const normalizedTitles = Array.isArray(titles) ? titles : (titles ? [titles] : []);
      
      // Adjust titles array to match videos array length
      if (videos.length > normalizedTitles.length) {
        normalizedTitles.push(...Array(videos.length - normalizedTitles.length).fill("Untitled"));
      }

      try {
        // Process video files
        const videoFileData = videos.map((file) => ({
          filename: file.filename,
          type: 'file'
        }));

        // Process video links
        const videoLinkData = normalizedLinks.map((link) => ({
          filename: link,
          type: 'link'
        }));

        const videoData = [...videoFileData, ...videoLinkData];

        // Get video durations and process data
        const processedVideoData = await Promise.all(videoData.map(async (video) => {
          if (video.type === 'file') {
            const videoPath = `./images/${video.filename}`; // Adjust path as necessary
            const duration = await getVideoDurationInSeconds(videoPath);
            return {
              ...video,
              duration,
              link: null // No link for file videos
            };
          } else {
            return {
              ...video,
              duration: null,
              link: video.filename // Link stored in filename
            };
          }
        }));

        // Calculate total duration for file videos
        const totalDurationInSeconds = calculateTotalDuration(processedVideoData
          .filter(v => v.type === 'file')
          .map(v => v.duration));
        const formattedTotalDuration = formatDuration(totalDurationInSeconds);

        // Delete old videos for the course before adding new ones
        const deleteVideosSql = 'DELETE FROM videos WHERE course_id = ?';
        db.query(deleteVideosSql, [courseId], (err) => {
          if (err) {
            console.error("Failed to delete old videos:", err);
            return res.status(500).send({
              error: "Failed to delete old videos",
              message: err.message,
            });
          }

          // Prepare data for insertion
          const videoValues = processedVideoData.map((video, index) => [
            courseId,
            normalizedTitles[index] || "Untitled", // Provide default title if missing
            video.type === 'file' ? video.filename : '', // URL for files, empty string for links
            video.type === 'link' ? video.link : '', // Link for links, empty string for files
            video.type,
            formatDuration(video.duration || 0)
          ]);

          const insertVideoSql = "INSERT INTO videos (course_id, title, url, link, type, duration) VALUES ?";
          db.query(insertVideoSql, [videoValues], (err) => {
            if (err) {
              console.error("Failed to add videos:", err);
              return res.status(500).send({
                error: "Failed to add videos",
                message: err.message,
              });
            }

            // Update course total video duration
            const updateCourseDurationSql = "UPDATE Courses SET total_video_duration = ? WHERE id = ?";
            db.query(updateCourseDurationSql, [formattedTotalDuration, courseId], (err) => {
              if (err) {
                console.error("Failed to update course duration:", err);
                return res.status(500).send({
                  error: "Failed to update course duration",
                  message: err.message,
                });
              }

              res.send({
                message: "Course and videos updated successfully",
                totalDuration: formattedTotalDuration,
              });
            });
          });
        });
      } catch (error) {
        console.error("Failed to process videos:", error);
        return res.status(500).send({
          error: "Failed to process videos",
          message: error.message,
        });
      }
    });
  });
});

// const updateTeacherCourse = asyncHandler(async (req, res) => {
//   const {
//       subject_name,
//       department_id,
//       before_offer,
//       after_offer,
//       coupon,
//       descr,
//       std_num,
//       rating,
//       email
//   } = req.body;

//   const img = req.files["img"] ? req.files["img"][0].filename : null;
//   const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
  
//   // Get the course ID from URL parameters
//   const {courseId} = req.params;

//   if (!courseId) {
//       return res.status(400).send({
//           error: "Course ID is required",
//       });
//   }

//   const checkTeacherSql = 'SELECT id FROM teacher WHERE email = ?';
//   db.query(checkTeacherSql, [email], (err, results) => {
//       if (err) {
//           console.error("Error checking teacher:", err);
//           return res.status(500).json({ error: "Database error" });
//       }

//       if (results.length === 0) {
//           return res.status(400).json({ error: "Invalid email" });
//       }

//       const teacherId = results[0].id;

//       // Update course details
//       const updateCourseSql = `
//           UPDATE Courses
//           SET
//               subject_name = ?,
//               department_id = ?,
//               before_offer = ?,
//               after_offer = ?,
//               coupon = ?,
//               descr = ?,
//               std_num = ?,
//               rating = ?,
//               teacher_id = ?,
//               img = COALESCE(?, img),
//               defaultvideo = COALESCE(?, defaultvideo)
//           WHERE id = ?
//       `;

//       db.query(updateCourseSql, [
//           subject_name,
//           department_id,
//           before_offer,
//           after_offer,
//           coupon,
//           descr,
//           std_num,
//           rating,
//           teacherId,
//           img,
//           defaultvideo,
//           courseId
//       ], async (err, result) => {
//           if (err) {
//               console.error("Failed to update course:", err);
//               return res.status(500).send({
//                   error: "Failed to update course",
//                   message: err.message,
//               });
//           }

//           const titles = req.body["title"];
//           const videos = Array.isArray(req.files["url"]) ? req.files["url"] : [];

//           // Normalize titles to an array if it's a single value
//           const normalizedTitles = Array.isArray(titles) ? titles : (titles ? [titles] : []);

//           if (videos.length > normalizedTitles.length) {
//               normalizedTitles.push(...Array(videos.length - normalizedTitles.length).fill("Untitled"));
//           }

//           console.log("Titles:", normalizedTitles); // Debugging titles
//           console.log("Videos:", videos); // Debugging videos

//           if (videos.length > 0) {
//               try {
//                   const videoData = await Promise.all(videos.map(async (video, index) => {
//                       const videoPath = `./images/${video.filename}`;
//                       const duration = await getVideoDurationInSeconds(videoPath);
//                       return {
//                           filename: video.filename,
//                           duration,
//                       };
//                   }));

//                   const totalDurationInSeconds = calculateTotalDuration(videoData.map(v => v.duration));
//                   const formattedTotalDuration = formatDuration(totalDurationInSeconds);

//                   // Delete old videos for the course before adding new ones
//                   const deleteVideosSql = 'DELETE FROM videos WHERE course_id = ?';
//                   db.query(deleteVideosSql, [courseId], (err) => {
//                       if (err) {
//                           console.error("Failed to delete old videos:", err);
//                           return res.status(500).send({
//                               error: "Failed to delete old videos",
//                               message: err.message,
//                           });
//                       }

//                       // Correctly pair titles with videos
//                       const videoValues = videoData.map((video, index) => {
//                           const title = normalizedTitles[index] || "Untitled";
//                           console.log(`Processing video: ${video.filename} with title: ${title}`); // Debugging
//                           return [
//                               courseId,
//                               title,
//                               video.filename,
//                               formatDuration(video.duration),
//                           ];
//                       });

//                       console.log("Video Values for Insertion:", videoValues); // Debugging

//                       const insertVideoSql = "INSERT INTO videos (course_id, title, url, duration) VALUES ?";
//                       db.query(insertVideoSql, [videoValues], (err) => {
//                           if (err) {
//                               console.error("Failed to add videos:", err);
//                               return res.status(500).send({
//                                   error: "Failed to add videos",
//                                   message: err.message,
//                               });
//                           }

//                           const updateCourseDurationSql = "UPDATE Courses SET total_video_duration = ? WHERE id = ?";
//                           db.query(updateCourseDurationSql, [formattedTotalDuration, courseId], (err) => {
//                               if (err) {
//                                   console.error("Failed to update course duration:", err);
//                                   return res.status(500).send({
//                                       error: "Failed to update course duration",
//                                       message: err.message,
//                                   });
//                               }

//                               res.send({
//                                   message: "Course and videos updated successfully",
//                                   totalDuration: formattedTotalDuration,
//                               });
//                           });
//                       });
//                   });
//               } catch (error) {
//                   console.error("Failed to get video duration:", error);
//                   return res.status(500).send({
//                       error: "Failed to get video duration",
//                       message: error.message,
//                   });
//               }
//           } else {
//               res.send({
//                   message: "Course updated successfully, but no videos provided",
//                   totalDuration: "0h 0m 0s",
//               });
//           }
//       });
//   });
// });

const deleteTeacherCourse = asyncHandler(async (req, res) => {
  const {id} = req.params;

  if (!id) {
      return res.status(400).json({ error: "id is required" });
  }

  // Delete from course_users first
  db.query(`DELETE FROM courses WHERE id = ?`, [id], (err, result) => {
      if (err) {
          console.error("Error deleting courses:", err);
          return res.status(500).json({ error: "Database error during courses deletion" });
      }

      // Then delete from payments
      db.query(`DELETE FROM videos WHERE course_id = ?`, [id], (err, result) => {
          if (err) {
              console.error("Error deleting videos:", err);
              return res.status(500).json({ error: "Database error during videos deletion" });
          }

          // Send response after both deletions are complete
          res.json({ message: "courses and videos deleted successfully" });
      });
  });
});



module.exports = {addTeacherAndcourses,getTeacher,getTeacherById,updateTeacher,deleteTeacher ,getStudentCountForTeacher,teacherAddCourse,getTeacherCourseById,updateTeacherCourse,deleteTeacherCourse};

