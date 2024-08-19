const db = require("../config.js");

const asyncHandler = require("../Middleware/asyncHandler.js");


const User = {};

User.create = (name, email, password, role,img, callback) => {
 
  const query = 'INSERT INTO users (name, email,  password, role, img) VALUES (?, ?, ?, ?, ?)';
  db.execute(query, [name, email,  password, role, img], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

User.findByEmail = (email, callback) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  db.execute(query, [email], (err, result) => {
    if (err) return callback(err);
    callback(null, result[0]);
  });
};





User.findById = (id, callback) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result[0]);
  });
};





// Define deleteStudent function
User.deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delete related records in the `course_users` table
  const deleteCourseUsersSql = 'DELETE FROM course_users WHERE user_id = ?';
  db.query(deleteCourseUsersSql, [id], (deleteCourseUsersErr) => {
    if (deleteCourseUsersErr) {
      console.error('Error deleting related course_users: ' + deleteCourseUsersErr.message);
      return res.status(500).json({ message: "Error deleting related course_users" });
    }

  // Delete related records in the `teacher_students` table
  const deleteCourseUsersSql = 'DELETE FROM teacher_students WHERE student_id = ?';
  db.query(deleteCourseUsersSql, [id], (deleteCourseUsersErr) => {
    if (deleteCourseUsersErr) {
      console.error('Error deleting related teacher_students: ' + deleteCourseUsersErr.message);
      return res.status(500).json({ message: "Error deleting related teacher_students" });
    }


    // Delete related records in the `payments` table
    const deletePaymentsSql = 'DELETE FROM payments WHERE user_id = ?';
    db.query(deletePaymentsSql, [id], (deletePaymentsErr) => {
      if (deletePaymentsErr) {
        console.error('Error deleting related payments: ' + deletePaymentsErr.message);
        return res.status(500).json({ message: "Error deleting related payments" });
      }

      // Delete the student from the `users` table
      const deleteStudentSql = 'DELETE FROM users WHERE id = ? AND role = "student"';
      db.query(deleteStudentSql, [id], (deleteStudentErr, deleteStudentResult) => {
        if (deleteStudentErr) {
          console.error('Error deleting student: ' + deleteStudentErr.message);
          return res.status(500).json({ message: "Error deleting student" });
        }

        if (deleteStudentResult.affectedRows === 0) {
          return res.status(404).json({ message: "Student not found" });
        }

        return res.json({ message: "Student and related records deleted successfully" });
      });
    });
  });
});
});





// Define deleteAdmin function
User.deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delete related records in the `course_users` table
  const deleteCourseUsersSql = 'DELETE FROM course_users WHERE user_id = ?';
  db.query(deleteCourseUsersSql, [id], (deleteCourseUsersErr) => {
    if (deleteCourseUsersErr) {
      console.error('Error deleting related course_users: ' + deleteCourseUsersErr.message);
      return res.status(500).json({ message: "Error deleting related course_users" });
    }

  // Delete related records in the `teacher_students` table
  const deleteCourseUsersSql = 'DELETE FROM teacher_students WHERE student_id = ?';
  db.query(deleteCourseUsersSql, [id], (deleteCourseUsersErr) => {
    if (deleteCourseUsersErr) {
      console.error('Error deleting related teacher_students: ' + deleteCourseUsersErr.message);
      return res.status(500).json({ message: "Error deleting related teacher_students" });
    }


    // Delete related records in the `payments` table
    const deletePaymentsSql = 'DELETE FROM payments WHERE user_id = ?';
    db.query(deletePaymentsSql, [id], (deletePaymentsErr) => {
      if (deletePaymentsErr) {
        console.error('Error deleting related payments: ' + deletePaymentsErr.message);
        return res.status(500).json({ message: "Error deleting related payments" });
      }

      // Delete the student from the `users` table
      const deleteStudentSql = 'DELETE FROM users WHERE id = ? AND role = "admin"';
      db.query(deleteStudentSql, [id], (deleteStudentErr, deleteStudentResult) => {
        if (deleteStudentErr) {
          console.error('Error deleting admin: ' + deleteStudentErr.message);
          return res.status(500).json({ message: "Error deleting admin" });
        }

        if (deleteStudentResult.affectedRows === 0) {
          return res.status(404).json({ message: "admin not found" });
        }

        return res.json({ message: "admin and related records deleted successfully" });
      });
    });
  });
});
});

module.exports = User;
