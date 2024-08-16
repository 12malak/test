const db = require("../config.js");


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

module.exports = User;