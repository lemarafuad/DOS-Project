const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// Database file path
const dbFilePath = 'database.db';

// Check if the database file exists
const isDatabaseNew = !fs.existsSync(dbFilePath);

// Create a new database or connect to the existing one
const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to database");
  }
});

// Create table
db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Title TEXT,
        Topic TEXT,
        Price INTEGER,
        Stock INTEGER 
      )
  `);

  // Insert data only if the database is new
  if (isDatabaseNew) {
    db.run(`INSERT INTO books (Title, Topic, Price, Stock) VALUES
            ('How to get a good grade in DOS in 40 minutes a day', 'distributed systems', 40, 10),
            ('RPCs for Noobs', 'distributed systems', 50, 5),
            ('Xen and the Art of Surviving Undergraduate School', 'undergraduate school', 30, 8),
            ('Cooking for the Impatient Undergrad', 'undergraduate school', 25, 7)
    `, (err) => {
      if (err) {
        console.log("Error inserting initial books:", err.message);
      } else {
        console.log("Sample books inserted");
      }
    });

    db.run(`INSERT INTO books (Title, Topic, Price, Stock) VALUES
            ('How to finish Project 3 on time', 'time management', 35, 10),
            ('Why theory classes are so hard', 'academics', 45, 6),
            ('Spring in the Pioneer Valley', 'travel', 30, 4)
    `, (err) => {
      if (err) {
        console.log("Error inserting spring break sale books:", err.message);
      } else {
        console.log("Spring break sale books inserted successfully");
      }
    });
  } else {
    console.log("Database already exists. Skipping data insertion.");
  }
});

// SQL operations
let sql;

function SearchTopic(Topic, callback) {
  sql = `SELECT * FROM books WHERE Topic=?`;
  db.all(sql, [Topic], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function Info(id, callback) {
  sql = `SELECT * FROM books WHERE id=?`;
  db.all(sql, [id], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

function updateStock(stock, id, callback) {
  sql = `UPDATE books SET Stock=? WHERE id=?`;
  db.run(sql, [stock, id], (err) => {
    if (err) {
      callback(err);
    } else {
      console.log("Stock updated successfully");
      callback(null);
    }
  });
}

module.exports = {
  SearchTopic,
  Info,
  updateStock,
};
