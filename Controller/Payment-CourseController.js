const db = require("../config.js");
const asyncHandler = require("../Middleware/asyncHandler.js");

const buyCourse = (req, res) => {
    const { student_name, email, address, phone, course_id, coupon_code, user_id } = req.body;
    if (!student_name || !email || !address || !phone || !course_id || !coupon_code || !user_id) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Step 1: Check if the coupon code is valid
    const checkCouponSql = 'SELECT id, used FROM coupons WHERE coupon_code = ?';
    db.query(checkCouponSql, [coupon_code], (err, results) => {
        if (err) {
            console.error("Error checking coupon:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0 || results[0].used) {
            return res.status(400).json({ error: "Invalid or already used coupon code" });
        }

        const coupon_id = results[0].id;

        // Step 2: Insert the payment record
        const insertPaymentSql = `
            INSERT INTO payments (student_name, email, address, phone, course_id, coupon_id, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertPaymentSql, [student_name, email, address, phone, course_id, coupon_id, user_id], (err, result) => {
            if (err) {
                console.error("Error inserting payment:", err);
                return res.status(500).json({ error: "Database error" });
            }

            const payment_id = result.insertId;

           // Step 3: Fetch the course to ensure it exists
           const fetchCoursesSql = 'SELECT id FROM courses WHERE id = ?';
           db.query(fetchCoursesSql, [course_id], (err, courses) => {
               if (err) {
                   console.error("Error fetching courses:", err);
                   return res.status(500).json({ error: "Database error" });
               }

               if (courses.length === 0) {
                   return res.status(400).json({ error: "No courses found" });
               }

               // Step 4: Mark the coupon as used
               const markCouponUsedSql = 'UPDATE coupons SET used = TRUE WHERE id = ?';
               db.query(markCouponUsedSql, [coupon_id], (err, result) => {
                   if (err) {
                       console.error("Error marking coupon as used:", err);
                       return res.status(500).json({ error: "Database error" });
                   }

                   // Step 5: Insert record into course_users table
                   const insertCourseUsersSql = `
        INSERT INTO course_users (user_id, course_id, payment_id)
        VALUES (?, ?, ?)`;

       const courseUserPromises = courses.map(course => {
           return new Promise((resolve, reject) => {
             db.query(insertCourseUsersSql, [user_id, course.id, payment_id], (err, result) => {
               if (err) {
                 return reject(err);
               }
               resolve(result);
             });
           });
         });



         Promise.all(courseUserPromises)
         .then(() => {
           res.json({ message: "Department purchased successfully and courses unlocked" });
         })
         .catch(err => {
           console.error("Error inserting course_users:", err);
           return res.status(500).json({ error: "Database error" });
         });
               });
           });
       });
   });
};



const validateCouponCode = async (req, res) => {
   const { coupon_code } = req.body;
 
   if (!coupon_code) {
     return res.status(400).json({ error: 'Coupon code is required' });
   }
 
   try {
     const checkCouponSql = 'SELECT id, used FROM coupons WHERE coupon_code = ?';
     db.query(checkCouponSql, [coupon_code], (err, results) => {
       if (err) {
         console.error("Error checking coupon:", err);
         return res.status(500).json({ error: "Database error" });
       }
 
       if (results.length === 0 || results[0].used) {
         return res.status(400).json({ error: "Invalid or already used coupon code" });
       }
 
       // Coupon is valid
       res.status(200).json({ message: "Coupon code is valid", couponId: results[0].id });
     });
   } catch (error) {
     console.error("Error validating coupon code:", error);
     res.status(500).json({ error: "Internal Server Error" });
   }
 };

 const getApprovedCoursesForUser = asyncHandler(async (req, res) => {
  const { user_id } = req.params; // Assuming user_id is passed as a URL parameter

  const sqlSelect = `
  SELECT course_users.*, 
         department.title AS department_name,
         department.id AS department_id,
         courses.subject_name AS subject_name,
         courses.id AS course_id,
         courses.created_at AS course_created_at,
         courses.img AS img,
         teacher.teacher_name AS teacher_name
  FROM course_users
  LEFT JOIN payments ON course_users.payment_id = payments.id
  LEFT JOIN department ON payments.department_id = department.id
  LEFT JOIN courses ON course_users.course_id = courses.id
  LEFT JOIN teacher ON courses.teacher_id = teacher.id
  WHERE course_users.payment_status = 'approved' 
    AND course_users.user_id = ?
`;

  db.query(sqlSelect, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching approved courses:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

module.exports = { buyCourse ,validateCouponCode ,getApprovedCoursesForUser};
