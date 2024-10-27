//import the require modules 
const express = require('express');              //1)import express module for bulding servers
const http = require('http');                    //2)import http module for http req
const axios = require('axios');                  //3)import axios module for req also
const sqlite3 = require('sqlite3').verbose();    //4)Import Sqlite3 module for database
const db = new sqlite3.Database('dbase.db');  //create Sqlite3 database instance
const app = express();                           //create express app
const port = 4000;                               //the port for front end server is 5000

let ordersql = `CREATE TABLE IF NOT EXISTS "order" (order_number INTEGER PRIMARY KEY, item_number)`;   // sql query to create order table

db.run(ordersql, (err) => {                                                                            //excute the query      
    if (err) {
        console.error('Error in creating table:', err.message);                                       //error handling
    } else {
        console.log('the order table created successfully');
    }
});


app.post('/purchase/:item_number', (req, res) => {                                                     //handle post req     
    const item_numberr = req.params.item_number; 
 
    const insert_query = `INSERT INTO "order" (item_number) VALUES (?)`;                               //insert order to the order table 
    db.run(insert_query, [item_numberr], (err) => {                                                    //excute  the query
        if (err) {
            console.error('Error in inserting the data:', err.message);
        } else {
            console.log('inserted successfully');
        }
    });

    const select_query = `SELECT * FROM "order"`;                                                       //query for select all order 
    db.all(select_query, [], (err, rows) => {
        if (err) {
            console.error(' querying error:', err.message);
        } else {
            console.log('table result:');                                                              // print all orders 
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

app.listen(port, () => {                                                                            // start the order server on port 5000
    console.log('Server is running on port:', port);

});