const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Controller/UserController');
const db = require("../config.js");
exports.register = async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const img = req.file ? req.file.path : 'acc_icon.png'; // Default image path

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).send('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.create(name, email, hashedPassword, role, img);
    const userId = result.insertId;

    res.status(201).json({ message: 'User registered', id: userId, img: img });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error');
  }
};
// exports.register = (req, res) => {
//   const { name, email, password, confirmPassword, role } = req.body;

// // const img='./images/acc_icon.png';
// const img = req.file ? req.file.path : 'acc_icon.png'; // Default image path


//   if (password !== confirmPassword) {
//     return res.status(400).send('Passwords do not match');
//   }
//   User.findByEmail(email, (err, user) => {
//     if (err) return res.status(500).send('Server error');
//     if (user) return res.status(400).send('Email already in use'); // Email already exists

//   bcrypt.hash(password, 10, (err, hash) => {
//     if (err) return res.status(500).send(err);

//     User.create(name, email, hash, role,img, (err, result) => {
//       const userId = result.insertId;
//       if (err) return res.status(500).send(err);
//       res.status(201).json({ message: 'User registered', id: userId, img: img });
//     });
//   });
// });
// };

// exports.login = (req, res) => {
//   const { email, password } = req.body;

//   User.findByEmail(email, (err, user) => {
//     if (err) return res.status(500).send(err);
//     if (!user) return res.status(400).send('User not found');

//     bcrypt.compare(password, user.password, (err, isMatch) => {
//       if (err) return res.status(500).send(err);
//       if (!isMatch) return res.status(400).send('Invalid password');

//       const token = jwt.sign(
//         { id: user.id, role: user.role, name: user.name , img: user.img}, // Include the user's name in the payload
//         'your_jwt_secret',
//         { expiresIn: '1h' }
//       );
//       res.status(200).json({ token, name: user.name, role: user.role, id: user.id, img: user.img });
//     });
//   });
// };
// exports.login = (req, res) => {
//   const { email, password } = req.body;
  
//   User.findByEmail(email, (err, user) => {
//       if (err) return res.status(500).send(err);
//       if (!user) return res.status(400).send('User not found');

//       bcrypt.compare(password, user.password, (err, isMatch) => {
//           if (err) return res.status(500).send(err);
//           if (!isMatch) return res.status(400).send('Invalid password');

//           const deviceId = crypto.randomBytes(16).toString('hex'); // Generate a unique device ID
//           const token = jwt.sign(
//               { id: user.id, role: user.role, name: user.name, img: user.img },
//               'your_jwt_secret',
//               { expiresIn: '1h' }
//           );

//           // Check current devices for the user
//           db.query('SELECT COUNT(*) as count FROM user_devices WHERE user_id = ?', [user.id], (err, results) => {
//               if (err) return res.status(500).send(err);
              
//               const deviceCount = results[0].count;

//               if (deviceCount >= 2) {
//                   // Remove the oldest device
//                   db.query('DELETE FROM user_devices WHERE user_id = ? ORDER BY last_login ASC LIMIT 1', [user.id], (err) => {
//                       if (err) return res.status(500).send(err);

//                       // Add the new device
//                       addDevice();
//                   });
//               } else {
//                   // Add the new device directly
//                   addDevice();
//               }

//               function addDevice() {
//                   db.query('INSERT INTO user_devices (user_id, device_id) VALUES (?, ?)', [user.id, deviceId], (err) => {
//                       if (err) return res.status(500).send(err);
//                       res.status(200).json({ token, name: user.name, role: user.role, id: user.id, img: user.img });
//                   });
//               }
//           });
//       });
//   });
// };

const SECRET_KEY = 'your_jwt_secret';
const MAX_DEVICES = 2;


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid password');

    if (user.device_count >= MAX_DEVICES) {
      return res.status(403).json({ message: 'You are logged in on too many devices. Please log out from another device.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, img: user.img },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    const decoded = jwt.verify(token, SECRET_KEY);
    // Increment device count
    await User.incrementDeviceCount(user.id);

    res.status(200).json({
      token,
      name: user.name,
      role: user.role,
      id: user.id,
      img: user.img
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};



exports.logout = async (req, res) => {
  const { token } = req.body; // Extract token from request body
  if (!token) return res.status(400).send('Token is required');
  try {
    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Optionally handle user session cleanup
    await User.decrementDeviceCount(decoded.id);

    // Respond with a success message
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('JWT Error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).send('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).send('Token has expired');
    } else {
      return res.status(500).send('Server error');
    }
  }
};
