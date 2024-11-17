//import the require modules 
const express = require('express');
const http = require('http');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dbase.db');
const app = express();
const port = process.env.PORT || 4000;


const catalogReplicas = ['http://catalog1:5000', 'http://catalog2:5001'];
let catalogIndex = 0;   
function getCatalogReplica() {
    const replica = catalogReplicas[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return replica;
  }
  
let ordersql = `CREATE TABLE IF NOT EXISTS "order" (order_number INTEGER PRIMARY KEY, item_number)`;

db.run(ordersql, (err) => {
    if (err) {
        console.error('Error in creating table:', err.message);
    } else {
        console.log('the order table created successfully');
    }
});


app.post('/purchase/:item_number', (req, res) => {
    const item_numberr = req.params.item_number;

    const insert_query = `INSERT INTO "order" (item_number) VALUES (?)`;
    db.run(insert_query, [item_numberr], (err) => {
        if (err) {
            console.error('Error in inserting the data:', err.message);
        } else {
            console.log('inserted successfully');
        }
    });

    const select_query = `SELECT * FROM "order"`;
    db.all(select_query, [], (err, rows) => {
        if (err) {
            console.error(' querying error:', err.message);
        } else {
            console.log('table result:');
            rows.forEach((row) => {
                console.log(row);
            });
        }
    });
    
    http.get('http://localhost:5000/info/' + req.params.item_number, (response) => { 
        var responseData = ''; 
        response.on("data", (chunk)=>{
        responseData = JSON.parse(chunk);
        console.log('Fetched successfully');
        console.log(responseData);

        });

        response.on('end', () => {
            try {
    
                    if (responseData[0].Stock > 0) {
                        const updatedStock = responseData[0].Stock - 1;
    
                        const updatedData = { Stock: updatedStock };
    
                        axios.put('http://localhost:5000/update/' + req.params.item_number, updatedData)
                            .then(( response) => {
                                console.log("Stock updated successfully");
                                res.json({ message: 'Purchase completed' });
                            })
                            .catch((error) => {
                                console.error("Error updating stock:", error);
                                res.status(500).json({ message: 'Error updating stock' });
                            });
                            res.json({ message: 'Purchase completed' });
                    } else {
                        res.json({ message: 'Item is sold out' });
                    }
            } catch (error) {
                console.error("Failed to parse JSON:", error, responseData);
                res.status(500).json({ message: 'Error parsing item info' });
            }
        });

    });

});

app.listen(port, () => {
    console.log(`Order server is running at ${port}`);
});