const db = require("../config.js");
const asyncHandler = require("../Middleware/asyncHandler.js");
const getDepartments = (req, res) => {
  const sql = "SELECT id, title FROM department";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
};

const getPayments = asyncHandler(async (req, res) => {
  // Fetch data from blog and department tables to return department name
  const sqlSelect = `
     SELECT payments.*, 
       coupons.coupon_code AS code,
       department.title AS department_name,
       MAX(course_users.payment_status) AS payment_status
FROM payments
JOIN coupons ON payments.coupon_id = coupons.id
LEFT JOIN department ON payments.department_id = department.id
LEFT JOIN course_users ON payments.user_id = course_users.user_id
GROUP BY payments.id, coupons.coupon_code, department.title;


    `;

  db.query(sqlSelect, (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(200).json(result);
  });
});


const updateStatusPayments = asyncHandler(async (req, res) => {
  const { payment_status } = req.body;
  const paymentId = req.params.id;

  if (!payment_status) {
    return res
      .status(400)
      .json({ error: "Payment ID and status are required" });
  }
  db.query(
    "SELECT id FROM payments WHERE id = ?",
    [paymentId],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ error: "Database error while fetching payment ID" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const fetchedPaymentId = results[0].id;

      // Update status in course_user table
      const query =
        "UPDATE course_users SET payment_status = ? WHERE payment_id = ?";
      db.query(query, [payment_status, fetchedPaymentId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Payment status updated successfully" });
      });
    }
  );
});
const getJustCourseUser=asyncHandler(async(req,res)=>{
  const sql="SELECT * FROM course_users";
  db.query(sql,(err,result)=>{
    if(err){
      console.error('Error fetching course user data: '+err.message);
    }
    res.json(result);
  })
})
const getCourseUsers = asyncHandler(async (req, res) => {
  // Fetch data from blog and department tables to return department name
  const sqlSelect = `
SELECT course_users.*, 
       payments.student_name AS student_name,
       payments.email AS email,
       payments.address AS address,
       payments.phone AS phone,
       payments.course_id AS course_id,
       department.title AS department_name,
       department.id AS department_id,
       courses.subject_name AS subject_name
FROM course_users
LEFT JOIN payments ON course_users.payment_id = payments.id
LEFT JOIN department ON payments.department_id = department.id
LEFT JOIN courses ON course_users.course_id = courses.id

  `;
  db.query(sqlSelect, (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(200).json(result);
  });
});

const buyDepartment = (req, res) => {
  const { student_name, email, address, phone, coupon_code, department_id, user_id } = req.body;  
    if (!student_name || !email || !address || !phone || !coupon_code || !department_id || !user_id) {
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
      return res.status(400).json({ error: "رمز الكوبون غير صالح أو تم استخدامه بالفعل" });
    }

    const coupon_id = results[0].id;

    // Step 2: Insert the payment record 
    const insertPaymentSql = `
    INSERT INTO payments (student_name, email, address, phone, coupon_id, department_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(insertPaymentSql, [student_name, email, address, phone, coupon_id, department_id, user_id], (err, result) => {
      if (err) {
        console.error("Error inserting payment:", err);
        return res.status(500).json({ error: "Database error" });
      }
      const payment_id = result.insertId;


       // Step 3: Fetch the course to ensure it exists
      const fetchCoursesSql = 'SELECT id FROM courses WHERE department_id = ?';
      db.query(fetchCoursesSql, [department_id], (err, courses) => {
        if (err) {
          console.error("Error fetching courses:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (courses.length === 0) {
          return res.status(400).json({ error: "No courses found for this department" });
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
        return res.status(400).json({ error: "رمز الكوبون غير صالح أو تم استخدامه بالفعل" });
      }

      // Coupon is valid
      res.status(200).json({ message: "Coupon code is valid", couponId: results[0].id });
    });
  } catch (error) {
    console.error("Error validating coupon code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteCourseUsers = asyncHandler(async (req, res) => {
  const { payment_id } = req.params;

  if (!payment_id) {
      return res.status(400).json({ error: "payment_id is required" });
  }

  // Delete from course_users first
  db.query(`DELETE FROM course_users WHERE payment_id = ?`, [payment_id], (err, result) => {
      if (err) {
          console.error("Error deleting course_users:", err);
          return res.status(500).json({ error: "Database error during course_users deletion" });
      }

      // Then delete from payments
      db.query(`DELETE FROM payments WHERE id = ?`, [payment_id], (err, result) => {
          if (err) {
              console.error("Error deleting payments:", err);
              return res.status(500).json({ error: "Database error during payments deletion" });
          }

          // Send response after both deletions are complete
          res.json({ message: "Course_users and payments deleted successfully" });
      });
  });
});

module.exports = {
  getDepartments,
  buyDepartment,
  getPayments,
  updateStatusPayments,
  getCourseUsers,
  deleteCourseUsers,
  validateCouponCode,
  getJustCourseUser
};
