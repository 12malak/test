const { type } = require("os");
const asyncHandler = require("../Middleware/asyncHandler.js");

const db = require("../config.js");
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const path = require('path');

const ffmpegPath =  './ffmpeg/bin/ffmpeg-6.1-win-64/ffmpeg'
const ffprobePath = './ffmpeg/bin/ffprobe-6.1-win-64/ffprobe'
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


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

const addCourse = asyncHandler(async (req, res) => {
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
  } = req.body;

  // Normalize titles and links to be arrays
  const titles = req.body["title"] || [];
  const links = req.body["link"] || [];

  const normalizedTitles = Array.isArray(titles) ? titles : [titles];
  const normalizedLinks = Array.isArray(links) ? links : (links ? [links] : []);

  // Handle uploaded files
  const img = req.files["img"] ? req.files["img"][0].filename : null;
  const defaultvideo = req.files["defaultvideo"] ? req.files["defaultvideo"][0].filename : null;
  const videoFiles = req.files["url"] || [];  // Video files

  if (!subject_name) {
    return res.status(400).send({
      error: "Failed to add course",
      message: "Subject name cannot be null or empty",
    });
  }

  const courseSql =
    "INSERT INTO Courses (subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id, img, defaultvideo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    courseSql,
    [
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      std_num,
      rating,
      teacher_id,
      img,
      defaultvideo,
    ],
    async (err, result) => {
      if (err) {
        console.error("Failed to add course:", err);
        return res.status(500).send({
          error: "Failed to add course",
          message: err.message,
        });
      }

      const courseId = result.insertId;

      // Handle videos
      try {
        // Video data from uploaded files
        const videoFileData = videoFiles.map((file) => ({
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
            // For video links, set duration to null
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

          // Update course with total duration
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
        console.error("Failed to process videos:", error);
        return res.status(500).send({
          error: "Failed to process videos",
          message: error.message,
        });
      }
    }
  );
});



// const addCourse = asyncHandler(async (req, res) => {
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
//   } = req.body;

//   const img = req.files["img"][0].filename;
//   const defaultvideo = req.files["defaultvideo"][0].filename;

//   if (!subject_name) {
//     return res.status(400).send({
//       error: "Failed to add course",
//       message: "Subject name cannot be null or empty",
//     });
//   }

//   const courseSql =
//     "INSERT INTO Courses (subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id, img, defaultvideo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

//   db.query(
//     courseSql,
//     [
//       subject_name,
//       department_id,
//       before_offer,
//       after_offer,
//       coupon,
//       descr,
//       std_num,
//       rating,
//       teacher_id,
//       img,
//       defaultvideo,
//     ],
//     async (err, result) => {
//       if (err) {
//         console.error("Failed to add course:", err);
//         return res.status(500).send({
//           error: "Failed to add course",
//           message: err.message,
//         });
//       }

//       const courseId = result.insertId;

//       // Handle videos
//       const titles = req.body["title"] || [];
//       const videos = req.files["url"] || [];

//       if (videos.length > 0) {
//         try {
//           const videoData = await Promise.all(videos.map(async (video, index) => {
//             const videoPath = `./images/${video.filename}`; // Adjust path as necessary
//             // const duration = await getVideoDurationInSeconds(videoPath);
//             return {
//               filename: video.filename,
//               // duration
//             };
//           }));

//           // Calculate total duration in seconds
//           const totalDurationInSeconds = calculateTotalDuration(videoData.map(v => v.duration));
//           const formattedTotalDuration = formatDuration(totalDurationInSeconds);

//           // Prepare data for insertion
//           const videoValues = videoData.map((video, index) => [
//             courseId,
//             titles[index] || "Untitled", // Provide default title if missing
//             video.filename,
//             formatDuration(video.duration),
//           ]);

//           const videoSql = "INSERT INTO videos (course_id, title, url, duration) VALUES ?";
//           db.query(videoSql, [videoValues], (err, result) => {
//             if (err) {
//               console.error("Failed to add videos:", err);
//               return res.status(500).send({
//                 error: "Failed to add videos",
//                 message: err.message,
//               });
//             }

//             // Update course with total duration
//             const updateCourseSql = "UPDATE Courses SET total_video_duration = ? WHERE id = ?";
//             db.query(updateCourseSql, [formattedTotalDuration, courseId], (err, result) => {
//               if (err) {
//                 console.error("Failed to update course duration:", err);
//                 return res.status(500).send({
//                   error: "Failed to update course duration",
//                   message: err.message,
//                 });
//               }

//               res.send({
//                 message: "Course and videos added successfully",
//                 totalDuration: formattedTotalDuration,
//               });
//             });
//           });
//         } catch (error) {
//           console.error("Failed to get video duration:", error);
//           return res.status(500).send({
//             error: "Failed to get video duration",
//             message: error.message,
//           });
//         }
//       } else {
//         // If no videos are provided, still add the course
//         res.send({
//           message: "Course added successfully, but no videos provided",
//           totalDuration: "0h 0m 0s",
//         });
//       }
//     }
//   );
// });

// const addCourse = asyncHandler(async (req, res) => {
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
//   } = req.body;

//   const img = req.files["img"][0].filename;
//   const defaultvideo = req.files["defaultvideo"][0].filename;

//   if (!subject_name) {
//     return res.status(400).send({
//       error: "Failed to add course",
//       message: "Subject name cannot be null or empty",
//     });
//   }

//   const courseSql =
//     "INSERT INTO Courses (subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id, img, defaultvideo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

//   db.query(
//     courseSql,
//     [
//       subject_name,
//       department_id,
//       before_offer,
//       after_offer,
//       coupon,
//       descr,
//       std_num,
//       rating,
//       teacher_id,
//       img,
//       defaultvideo,
//     ],
//     async (err, result) => {
//       if (err) {
//         console.error("Failed to add course:", err);
//         return res.status(500).send({
//           error: "Failed to add course",
//           message: err.message,
//         });
//       }

//       const courseId = result.insertId;

//       // Handle videos
//       const titles = req.body["title"] || [];
//       const videos = req.files["url"] || [];

//       if (videos.length > 0) {
//         try {
//           const videoValues = await Promise.all(videos.map(async (video, index) => {
//             const videoPath = `./images/${video.filename}`; // Adjust path as necessary
//             const duration = await getVideoDurationInSeconds(videoPath);
//             const formattedDuration = formatDuration(duration);

//             return [
//               courseId,
//               titles[index] || "Untitled", // Provide default title if missing
//               video.filename,
//               formattedDuration,
//             ];
//           }));

//           const videoSql = "INSERT INTO videos (course_id, title, url, duration) VALUES ?";
//           db.query(videoSql, [videoValues], (err, result) => {
//             if (err) {
//               console.error("Failed to add videos:", err);
//               return res.status(500).send({
//                 error: "Failed to add videos",
//                 message: err.message,
//               });
//             }

//             res.send({
//               message: "Course and videos added successfully",
//             });
//           });
//         } catch (error) {
//           console.error("Failed to get video duration:", error);
//           return res.status(500).send({
//             error: "Failed to get video duration",
//             message: error.message,
//           });
//         }
//       } else {
//         // If no videos are provided, still add the course
//         res.send({
//           message: "Course added successfully, but no videos provided",
//         });
//       }
//     }
//   );
// });

// const addCourse = asyncHandler(async (req, res) => {
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
//   } = req.body;

//   const img = req.files["img"][0].filename;
//   const defaultvideo = req.files["defaultvideo"][0].filename;

//   if (!subject_name) {
//     return res.status(400).send({
//       error: "Failed to add course",
//       message: "Subject name cannot be null or empty",
//     });
//   }

//   const courseSql =
//     "INSERT INTO Courses (subject_name, department_id, before_offer, after_offer, coupon, descr, std_num, rating, teacher_id, img, defaultvideo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

//   db.query(
//     courseSql,
//     [
//       subject_name,
//       department_id,
//       before_offer,
//       after_offer,
//       coupon,
//       descr,
//       std_num,
//       rating,
//       teacher_id,
//       img,
//       defaultvideo,
//     ],
//     (err, result) => {
//       if (err) {
//         console.error("Failed to add course:", err);
//         return res.status(500).send({
//           error: "Failed to add course",
//           message: err.message,
//         });
//       }

//       const courseId = result.insertId;

//       // Handle videos
//       const titles = req.body["title"] || [];
//       const videos = req.files["url"] || [];

//       if (videos.length > 0) {
//         // Ensure at least one title if there are videos
//         const videoValues = videos.map((video, index) => [
//           courseId,
//           titles[index] || "Untitled", // Provide default title if missing
//           video.filename,
//         ]);

//         const videoSql = "INSERT INTO videos (course_id, title, url) VALUES ?";
//         db.query(videoSql, [videoValues], (err, result) => {
//           if (err) {
//             console.error("Failed to add videos:", err);
//             return res.status(500).send({
//               error: "Failed to add videos",
//               message: err.message,
//             });
//           }

//           res.send({
//             message: "Course and videos added successfully",
//           });
//         });
//       } else {
//         // If no videos are provided, still add the course
//         res.send({
//           message: "Course added successfully, but no videos provided",
//         });
//       }
//     }
//   );
// });

const getcourses = asyncHandler(async (req, res) => {
  // SQL query to select all columns from courses, department title as department_name, and all columns from teacher
  const sqlSelect = `
       SELECT courses.*, 
              department.title AS department_name, 
              teacher.teacher_name AS teacher_name,
               teacher.descr AS teacher_descr,
               teacher.img AS teacher_img,
               DATE_FORMAT(courses.created_at, '%Y-%m-%d') AS created_date 
       FROM courses
       JOIN department ON courses.department_id = department.id
       JOIN teacher ON courses.teacher_id = teacher.id
    `;

  db.query(sqlSelect, (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(200).json(result);
  });
});

const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sqlSelect = `
    SELECT videos.*, 
           courses.subject_name AS subject_name,
           department.title AS department_name,
           courses.before_offer AS before_offer,
           courses.after_offer AS after_offer,
           courses.coupon AS coupon,
           courses.descr AS description_course,
           courses.std_num AS student_num,
           courses.rating AS rating,
           courses.img AS img,
           teacher.teacher_name AS teacher_name,
           courses.defaultvideo AS defaultvideo
    FROM videos
    JOIN courses ON videos.course_id = courses.id
    JOIN department ON courses.department_id = department.id
    JOIN teacher ON courses.teacher_id = teacher.id
    WHERE videos.course_id = ?`;

    // Assuming you are using a database client library like mysql2 or similar
    db.query(sqlSelect, [id], (err, result) => {
        if (err) {
            console.error("Error fetching data:", err);
            return res.status(500).json({ message: "Failed to fetch video data", error: err.message });
        }

        res.status(200).json(result);
    });
});


const getCourseById=asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const sqlSelect = `
    SELECT courses.*,  
           department.title AS department_name,
           teacher.teacher_name AS teacher_name,
           teacher.descr AS teacher_descr,
           teacher.img AS teacher_img
    FROM courses
    LEFT JOIN department ON courses.department_id = department.id
    LEFT JOIN teacher ON courses.teacher_id = teacher.id
    WHERE courses.id = ?`;
    
    db.query(sqlSelect,[id],(err,result)=>{
        if(err){
            console.error('Error fetching course data: '+err.message);
            return res.status(500).json({message:"Error fetching course data"});
        }
        res.status(200).json(result);
    });
})
// const getNumberOfCoursesByTeacher = asyncHandler(async (req, res) => {
//   const { teacherId } = req.params;

//   const sqlSelect = `
//     SELECT COUNT(*) AS course_count
//     FROM courses
//     WHERE teacher_id = ?`;

//   db.query(sqlSelect, [teacherId], (err, result) => {
//     if (err) {
//       console.error('Error fetching number of courses: ' + err.message);
//       return res.status(500).json({ message: "Error fetching number of courses" });
//     }

//     // Assuming the result contains a single row with the count
//     const courseCount = result[0].course_count;
//     res.status(200).json({ courseCount });
//   });
// });






const getByDepartment = (req, res) => {
  const department_id = req.params.id; // Access id from req.params
  const sqlSelect = `
      SELECT courses.*, department.title AS department_name,
      DATE_FORMAT(courses.created_at, '%Y-%m-%d') AS created_date
      FROM courses
      JOIN department ON courses.department_id = department.id
      WHERE courses.department_id = ?
  `;
  
  db.query(sqlSelect, [department_id], (err, result) => {
      if (err) {
          return res.status(500).json({ message: err.message });
      }
      res.json(result);
  });
};

const getcoursesCount = asyncHandler(async (req, res) => {
  const sqlSelect = `
  SELECT 
    courses.*, 
    department.title AS department_name, 
    teacher.teacher_name AS teacher_name,
    teacher.descr AS teacher_descr,
    teacher.img AS teacher_img,
    DATE_FORMAT(courses.created_at, '%Y-%m-%d') AS created_date,
    (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = teacher.id) AS course_count
  FROM 
    courses
  JOIN 
    department ON courses.department_id = department.id
  JOIN 
    teacher ON courses.teacher_id = teacher.id
`;

db.query(sqlSelect, (err, result) => {
  if (err) {
    return res.status(500).json({ message: err.message });
  }

  res.status(200).json(result);
});
});



const getCourseCountByTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get the teacher id from the request parameters
  const sqlSelect = `
    SELECT 
      COUNT(courses.id) AS course_count
    FROM 
      teacher
    LEFT JOIN 
      courses ON teacher.id = courses.teacher_id
    WHERE 
      teacher.id = ?
    GROUP BY 
      teacher.id, teacher.teacher_name
  `;


  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('Failed to fetch teacher course counts:', err);
      return res.status(500).send({
        error: 'Failed to fetch teacher course counts',
        message: err.message,
      });
    }


    res.status(200).json(result);
  });
});

  const getUserCountForCourse = asyncHandler(async (req, res) => {
    const { id} = req.params; 
    if (!id) {
      return res.status(400).send({
        error: 'Course ID is required',
      });
    }
      const sqlSelect = `
      SELECT c.id, COUNT(cu.user_id) AS student_count
      FROM course_users cu
      JOIN courses c ON cu.course_id = c.id
      WHERE c.id = ?
      GROUP BY c.id;
    `;
  
  
  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('Failed to fetch user count for course:', err);
      return res.status(500).send({
        error: 'Failed to fetch user count for course',
        message: err.message,
      });
    }
    res.status(200).json(result[0]); // Return the first result object
  });
});

const getLessonCountForCourses = asyncHandler(async (req, res) => {
  const { id} = req.params; 

  if (!id) {
    return res.status(400).send({
      error: 'Course ID is required',
    });
  }


  const sqlSelect = `
    SELECT course_id, COUNT(title) AS lesson_count
    FROM videos
     WHERE 
      course_id = ?
    GROUP BY course_id;
  `;

  db.query(sqlSelect, [id], (err, result) => {
    if (err) {
      console.error('Failed to fetch lesson count for courses:', err);
      return res.status(500).send({
        error: 'Failed to fetch lesson count for courses',
        message: err.message,
      });
    }

    if (result.length === 0) {
      console.warn('No lessons found');
      return res.status(404).send({
        message: 'No lessons found',
      });
    }

    res.status(200).json(result); // Return the result
  });
});
// const deleteCourse = asyncHandler(async (req, res) => {
//   const {id} = req.params;

//   if (!id) {
//       return res.status(400).json({ error: "id is required" });
//   }

//   // Delete from course_users first
//   db.query(`DELETE FROM courses WHERE id = ?`, [id], (err, result) => {
//       if (err) {
//           console.error("Error deleting courses:", err);
//           return res.status(500).json({ error: "Database error during courses deletion" });
//       }

//       // Then delete from payments
//       db.query(`DELETE FROM videos WHERE course_id = ?`, [id], (err, result) => {
//           if (err) {
//               console.error("Error deleting videos:", err);
//               return res.status(500).json({ error: "Database error during videos deletion" });
//           }

//           // Send response after both deletions are complete
//           res.json({ message: "courses and videos deleted successfully" });
//       });
//   });
// });
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    // Delete videos first
    await new Promise((resolve, reject) => {
      db.query(`DELETE FROM videos WHERE course_id = ?`, [id], (err, result) => {
        if (err) {
          console.error("Error deleting videos:", err);
          return reject(new Error("Database error during videos deletion"));
        }
        resolve(result);
      });
    });

    // Then delete from course_users
    await new Promise((resolve, reject) => {
      db.query(`DELETE FROM course_users WHERE course_id = ?`, [id], (err, result) => {
        if (err) {
          console.error("Error deleting course_users:", err);
          return reject(new Error("Database error during course_users deletion"));
        }
        resolve(result);
      });
    });
    await new Promise((resolve, reject) => {
      db.query(`DELETE FROM commentcourse WHERE course_id = ?`, [id], (err, result) => {
        if (err) {
          console.error("Error deleting commentcourse:", err);
          return reject(new Error("Database error during commentcourse deletion"));
        }
        resolve(result);
      });
    });
    await new Promise((resolve, reject) => {
      db.query(`DELETE FROM payments WHERE course_id = ?`, [id], (err, result) => {
        if (err) {
          console.error("Error deleting payments:", err);
          return reject(new Error("Database error during payments deletion"));
        }
        resolve(result);
      });
    });
    // Finally delete from courses
    await new Promise((resolve, reject) => {
      db.query(`DELETE FROM courses WHERE id = ?`, [id], (err, result) => {
        if (err) {
          console.error("Error deleting course:", err);
          return reject(new Error("Database error during course deletion"));
        }
        resolve(result);
      });
    });

    // Send success response
    res.json({ message: "Course, videos, and users deleted successfully" });

  } catch (error) {
    // Handle errors for any deletion step
    res.status(500).json({ error: error.message });
  }
});






const updateCourse = asyncHandler(async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    const { id } = req.params;
    const {
      subject_name,
      department_id,
      before_offer,
      after_offer,
      coupon,
      descr,
      teacher_id,
      
    } = req.body;

    // Normalize videoLinks from the request body
    const normalizedVideoLinks = [];
    for (let key in req.body) {
      if (key.startsWith('videoLinks[')) {
        const index = key.match(/\d+/)[0];
        const prop = key.match(/\.(\w+)$/)[1];
        normalizedVideoLinks[index] = normalizedVideoLinks[index] || {};
        normalizedVideoLinks[index][prop] = req.body[key];
      }
    }

    console.log("Normalized Video Links:", normalizedVideoLinks);

    // Handle file uploads
    let img = req.files?.img?.[0]?.filename || null;
    let defaultvideo = req.files?.defaultvideo?.[0]?.filename || null;
    const videoFiles = req.files?.videoFiles || [];

    // Check for existing data
    const checkSql = 'SELECT img, defaultvideo FROM Courses WHERE id = ?';
    const [checkResult] = await db.promise().query(checkSql, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'No data found for the specified ID' });
    }
    const currentImg = checkResult[0].img;
    const currentDefaultVideo = checkResult[0].defaultvideo;

    const updatedImg = img || currentImg;
    const updatedDefaultVideo = defaultvideo || currentDefaultVideo;

    // Update course information
    const courseSql = `
      UPDATE Courses
      SET subject_name = ?, department_id = ?, teacher_id = ?, before_offer = ?, after_offer = ?, coupon = ?, descr = ?, img = ?, defaultvideo = ?
      WHERE id = ?
    `;
    await db.promise().query(courseSql, [subject_name, department_id, teacher_id, before_offer, after_offer, coupon, descr, updatedImg, updatedDefaultVideo, id]);

    const existingVideosSql = 'SELECT id FROM videos WHERE course_id = ?';
    const [existingVideos] = await db.promise().query(existingVideosSql, [id]);

     // Prepare video data
const videoFileData = videoFiles.map((file, index) => {
  const originalNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');

  return {
    id: req.body[`id[${index}]`],
    title: req.body[`title[${index}]`] || originalNameWithoutExtension,
    url: file.filename || '', // Adjust if you need the full path
    type: 'file'
  };
});

    const videoLinkData = normalizedVideoLinks.map((link) => ({
      id: link.id, // Ensure each link has an ID
      title: link.title || "Untitled",
      filename: '', // No filename for links
      type: 'link',
      link: link.link // Access the link property
    }));

    const videoData = [...videoFileData, ...videoLinkData];

    const processedVideoData = await Promise.all(videoData.map(async (video) => {
      if (video.type === 'file') {
        const videoPath = `./images/${video.url}`;
        try {
          const duration = await getVideoDurationInSeconds(videoPath);
          return {
            ...video,
            duration : formatDuration(duration),
            link: null
          };
        } catch (error) {
          console.error('Error getting video duration:', error);
          return {
            ...video,
            duration: null,
            link: null
          };
        }
      } else {
        return {
          ...video,
          duration: "0h 0m 0s",
          link: video.link
        };
      }
    }));

    const updateVideoSql = `
      INSERT INTO videos (id, title, url, link, type, duration, course_id)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        url = VALUES(url),
        link = VALUES(link),
        type = VALUES(type),
        duration = VALUES(duration)
    `;
    
    const videoValues = processedVideoData.map((video) => [
      video.id || null, // Use null for new records
      video.title || "Untitled",
      video.type === 'file' ? video.url : '',
      video.type === 'link' ? video.link : '',
      video.type,
      video.duration,
      id
    ]);

    await db.promise().query(updateVideoSql, [videoValues]);

    res.json({
      id,
      subject_name,
      descr,
      before_offer,
      coupon,
      after_offer,
      department_id,
      teacher_id,
      img: updatedImg,
      defaultvideo: updatedDefaultVideo,
      videoFiles: videoFiles,
      links: normalizedVideoLinks
    });
  } catch (error) {
    console.error("General Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
});


const getCourseLinks = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const sql = 'SELECT id, title, link FROM videos WHERE course_id = ? AND type = "link"';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error("Error fetching video links:", err);
        return res.status(500).json({ error: 'Failed to fetch video links' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



const getCourseVideos = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Adjust the SQL query to fetch jest files 
    const sql = 'SELECT id, title, url, link, type FROM videos WHERE course_id = ? AND type = "file"';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error("Error fetching video data:", err);
        return res.status(500).json({ error: 'Failed to fetch video data' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});






const deleteVideoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Ensure this matches the route parameter

    if (!id) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Correct the variable name here
    const deleteVideoSql = 'DELETE FROM videos WHERE id = ?';
    
    // Execute the query with the correct variable
    const [result] = await db.promise().query(deleteVideoSql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video successfully deleted' });
  } catch (error) {
    console.error('Error deleting video:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while deleting the video' });
    }
  }
});



module.exports = { addCourse, getcourses ,updateCourse,getVideoById,deleteVideoById,getCourseById,getCourseCountByTeacher,getByDepartment,getcoursesCount ,getUserCountForCourse ,getLessonCountForCourses,deleteCourse,getCourseLinks,getCourseVideos};
