const db = require('../config');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing

const getProfile = (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.length === 0) {
      return res.status(404).send('User not found');
    }
    res.json(result[0]);
  });
};


// const updateProfile = async (req, res) => {
//   const userId = req.params.id;
//   const { name, email, password, confirmPassword } = req.body;
//   let img = req.file ? req.file.filename : null; // Handle file upload

//   if (password && password !== confirmPassword) {
//     return res.status(400).send('Passwords do not match');
//   }

//   let hashedPassword;
//   if (password) {
//     try {
//       hashedPassword = await bcrypt.hash(password, 10); // Hash the password
//     } catch (err) {
//       return res.status(500).send('Error hashing password');
//     }
//   }

//   // Update the user
//   const sql = password
//     ? 'UPDATE users SET name = ?, email = ?, img = ?, password = ? WHERE id = ?'
//     : 'UPDATE users SET name = ?, email = ?, img = ? WHERE id = ?';
//   const params = password
//     ? [name, email, img, hashedPassword, userId]
//     : [name, email, img, userId];

//   db.query(sql, params, (err, result) => {
//     if (err) {
//       return res.status(500).send(err);
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).send('User not found');
//     }

//     // Fetch the updated user data
//     const fetchSql = 'SELECT id, name, email, img FROM users WHERE id = ?';
//     db.query(fetchSql, [userId], (fetchErr, fetchResult) => {
//       if (fetchErr) {
//         return res.status(500).send(fetchErr);
//       }
//       if (fetchResult.length === 0) {
//         return res.status(404).send('User not found');
//       }
//       res.status(200).json(fetchResult[0]);
//     });
//   });
// };
const updateProfile = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, confirmPassword } = req.body;
  let img = req.file ? req.file.filename : null; // Handle file upload

  if (password && password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  let hashedPassword;
  if (password) {
    try {
      hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    } catch (err) {
      return res.status(500).send('Error hashing password');
    }
  }

  // First, fetch the current image for the user
  const fetchCurrentImageSql = 'SELECT img FROM users WHERE id = ?';
  db.query(fetchCurrentImageSql, [userId], (fetchErr, fetchResult) => {
    if (fetchErr) {
      return res.status(500).send(fetchErr);
    }
    if (fetchResult.length === 0) {
      return res.status(404).send('User not found');
    }

    // Use the existing image if no new image is provided
    const currentImage = fetchResult[0].img;
    img = img || currentImage;

    // Update the user
    const sql = password
      ? 'UPDATE users SET name = ?, email = ?, img = ?, password = ? WHERE id = ?'
      : 'UPDATE users SET name = ?, email = ?, img = ? WHERE id = ?';
    const params = password
      ? [name, email, img, hashedPassword, userId]
      : [name, email, img, userId];

    db.query(sql, params, (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('User not found');
      }

      // Fetch the updated user data
      const fetchSql = 'SELECT id, name, email, img FROM users WHERE id = ?';
      db.query(fetchSql, [userId], (fetchErr, fetchResult) => {
        if (fetchErr) {
          return res.status(500).send(fetchErr);
        }
        if (fetchResult.length === 0) {
          return res.status(404).send('User not found');
        }
        res.status(200).json(fetchResult[0]);
      });
    });
  });
};

// const updateProfile = async (req, res) => {
//     const userId = req.params.id;
//     const { name, email, password, confirmPassword } = req.body;
//     let img = req.file ? req.file.filename : null; // Handle file upload

//     if (password && password !== confirmPassword) {
//       return res.status(400).send('Passwords do not match');
//     }
  
//     let hashedPassword;
//     if (password) {
//       try {
//         hashedPassword = await bcrypt.hash(password, 10); // Hash the password
//       } catch (err) {
//         return res.status(500).send('Error hashing password');
//       }
//     }
  
//     const sql = password ? 
//     'UPDATE users SET name = ?, email = ?, img = ?, password = ? WHERE id = ?' :
//     'UPDATE users SET name = ?, email = ?, img = ? WHERE id = ?';
//   const params = password ? [name, email,img, hashedPassword, userId] : [name, email,img, userId];

//   db.query(sql, params, (err, result) => {
//     if (err) {
//       return res.status(500).send(err);
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).send('User not found');
//     }
//     res.send('Profile updated successfully');
//   });
// };
  module.exports = {
    getProfile,
    updateProfile
  };