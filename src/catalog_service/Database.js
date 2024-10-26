const sqlite3 =require("sqlite3").verbose();

// create new database
const db = new sqlite3.Database('database.db',sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,(err)=>{
if(err){
    console.log(err);
}
else{
    console.log("connect to database");
}})

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

   // Check if the table already contains data
   db.get(`SELECT COUNT(*) AS count FROM books`, (err, row) => {
    if (err) {
        console.log('Error checking books table:', err);
    } else if (row.count === 0) {
        // Insert sample books only if the table is empty
        db.run(`INSERT INTO books (Title, Topic, Price, Stock) VALUES
          ('How to get a good grade in DOS in 40 minutes a day', 'distributed systems', 40, 10),
          ('RPCs for Noobs', 'distributed systems', 50, 5),
          ('Xen and the Art of Surviving Undergraduate School', 'undergraduate school', 30, 8),
          ('Cooking for the Impatient Undergrad', 'undergraduate school', 25, 7)
        `);
        console.log('Sample books inserted');
    } else {
        console.log('Books table already contains data, skipping insert');
    }
});
});

  let sql ;

  function SearchTopic(Topic,callback){
    sql=`SELECT * FROM books where Topic=? `;
    db.all(sql,[Topic],(err , rows)=>{
    if(err)
      {
       callback(err,null);
      }
      else
      callback(null,rows);
    });
  }

  function Info(id,callback){
    sql=`SELECT * FROM books where id=? `;
    db.all(sql,[id],(err , rows)=>{
    if(err)
      {
       callback(err,null);
      }
      else
      callback(null,rows);
    });
  }

  function updateStock(stock,ISBN,callback){ 
    sql=`UPDATE catalog SET Stock = ? where ISBN = ?`;
    db.run(sql,[stock,ISBN],(err)=>{

        if (err) {
            //callback(err, null);
        } else {
            console.log("Stock updated successfully");
        }
    })
        
  }

  module.exports = {
    SearchTopic,
    Info,
    updateStock
};


