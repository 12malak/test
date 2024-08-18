const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Controller/UserController');

exports.register = (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

// const img='./images/acc_icon.png';
const img = req.file ? req.file.path : 'acc_icon.png'; // Default image path


  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }
  User.findByEmail(email, (err, user) => {
    if (err) return res.status(500).send('Server error');
    if (user) return res.status(400).send('Email already in use'); // Email already exists

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).send(err);

    User.create(name, email, hash, role,img, (err, result) => {
      const userId = result.insertId;
      if (err) return res.status(500).send(err);
      res.status(201).json({ message: 'User registered', id: userId, img: img });
    });
  });
});
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  User.findByEmail(email, (err, user) => {
    if (err) return res.status(500).send(err);
    if (!user) return res.status(400).send('User not found');

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).send(err);
      if (!isMatch) return res.status(400).send('Invalid password');

      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name , img: user.img}, // Include the user's name in the payload
        'your_jwt_secret',
        { expiresIn: '1h' }
      );
      res.status(200).json({ token, name: user.name, role: user.role, id: user.id, img: user.img });
    });
  });
};
