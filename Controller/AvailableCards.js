const db = require("../config.js");

const asyncHandler = require("../Middleware/asyncHandler.js");

const getavailableCards = (req, res) => {
  const { governorate_id } = req.params; // Get the governorate_id from the query parameters
  if (!governorate_id) {
    return res.status(400).send('Governorate parameter is required');
  }

  const sql = 'SELECT * FROM  availablecards WHERE governorate_id = ?';
  db.query(sql, [governorate_id], (err, result) => {
    if (err) {
      console.error('Error fetching data:', err.sqlMessage); // Logging the SQL error message
      res.status(500).send('Server error');
      return;
    }
    res.json(result);
  });
};
 const getAllavailableCards=asyncHandler(async(req,res)=>{
  const sqlSelect =  `
  SELECT  availablecards.*,governorate.governorate AS governorate_name
   FROM  availablecards
   JOIN governorate ON  availablecards.governorate_id = governorate.id
`;
  db.query(sqlSelect, (err, result) => {
    if (err) {
      console.error('Error selecting data: ' + err.message);
      return res.json({ message: "Error" });
    }
    res.status(201).json(result);
  });
 })


const getgovernorate = asyncHandler(async (req, res) => {
  const sqlSelect = "SELECT * FROM governorate";
  db.query(sqlSelect, (err, result) => {
    if (err) {
      console.error('Error selecting data: ' + err.message);
      return res.json({ message: "Error" });
    }
    res.status(201).json(result);
  });
})
const postAvailableCards = asyncHandler(async (req, res) => {
  const { governorate_id, name, location, address, phone } = req.body;
  // Convert governorate_id to an integer
  const numericGovernorateId = parseInt(governorate_id, 10);
  // Check if the conversion is successful
  if (isNaN(numericGovernorateId)) {
    return res.status(400).json({ message: 'Invalid governorate_id' });
  }
  const sqlInsert = "INSERT INTO availablecards (governorate_id, name, location, address, phone) VALUES (?, ?, ?, ?, ?)";
  db.query(sqlInsert, [numericGovernorateId, name, location, address, phone], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err.sqlMessage);
      return res.status(500).send('Server error');
    }
    res.status(201).json({ message: 'Card added successfully' });
  });
});


const updateAvailableCards= asyncHandler(async (req,res) => {
  const { id} = req.params;
  const { governorate_id, name, location, address, phone } = req.body;
  const sqlUpdate = "UPDATE availablecards SET governorate_id =?, name =?, location =?, address =?, phone =? WHERE id =?";
  db.query(sqlUpdate, [governorate_id, name, location, address, phone, id], (err, result) => {
    if (err) {
      console.error('Error updating data:', err.sqlMessage);
      return res.status(500).send('Server error');
    }
    res.status(200).json({ message: 'Card updated successfully' });
  });
})
const deleteAvailableCards= asyncHandler(async (req,res) => {
  const { id} = req.params;
  const sqlDelete = "DELETE FROM availablecards WHERE id =?";
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err.sqlMessage);
      return res.status(500).send('Server error');
    }
    res.status(200).json({ message: 'Card deleted successfully' });
  });
})
const postGovernorate= asyncHandler(async (req, res) => {
  const { governorate} = req.body;
  const sqlInsert = "INSERT INTO  governorate ( governorate) VALUES (?)";
  db.query(sqlInsert, [governorate], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err.sqlMessage);
      return res.status(500).send('Server error');
    }
    res.status(201).json({ message: ' governorate added successfully' });
  });
})
const deleteGovernorate= asyncHandler(async (req, res) => {
  const { id} = req.params;
  const sqlDelete = "DELETE FROM governorate WHERE id =?";
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err.sqlMessage);
      return res.status(500).send('Server error');
    }
    res.status(200).json({ message: 'Governorate deleted successfully' });
  });
})

module.exports = { getavailableCards ,getAllavailableCards,getgovernorate,postGovernorate,deleteGovernorate,postAvailableCards,updateAvailableCards,deleteAvailableCards};
