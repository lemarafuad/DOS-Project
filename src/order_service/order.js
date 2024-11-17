const express = require('express');
const http = require('http');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const LRU = require('lru-cache'); // LRU cache implementation
const db = new sqlite3.Database('dbase.db');
const app = express();
const port = process.env.PORT || 4000;

// Catalog replica endpoints
const catalogReplicas = ['http://localhost:5000', 'http://localhost:5001'];

// for round-robin load balancing
let catalogIndex = 0;

// Cache for purchase results
const orderCache = new LRU({ max: 100 });

// Round-robin load balancer for catalog replicas
function getCatalogReplica() {
    const replica = catalogReplicas[catalogIndex];
    console.log(`Selected catalog replica: ${replica} (index: ${catalogIndex})`);
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return replica;
}

// Create the order table if it doesn't exist
let ordersql = `CREATE TABLE IF NOT EXISTS "order" (order_number INTEGER PRIMARY KEY, item_number TEXT)`;
db.run(ordersql, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Order table created successfully');
    }
});

app.post('/purchase/:item_number', (req, res) => {
    const item_number = req.params.item_number;

    // Check if the result for this item is already cached
    if (orderCache.has(item_number)) {
        console.log('Fetched from cache');
        return res.json(orderCache.get(item_number));
    }

    // Fetch the item's stock information from a catalog replica
    const catalogReplica = getCatalogReplica();
    http.get(`${catalogReplica}/info/${item_number}`, (response) => {
        let responseData = '';

        response.on('data', (chunk) => {
            responseData += chunk;
        });

        response.on('end', () => {
            try {
                const parsedData = JSON.parse(responseData);
                const stock = parsedData[0]?.Stock;

                if (stock > 0) {
                    const updatedStock = stock - 1;
                    const updatedData = { Stock: updatedStock };

                    // Update stock in the catalog service
                    axios.put(`${catalogReplica}/update/${item_number}`, updatedData)
                        .then(() => {
                            console.log("Stock updated successfully");

                            // Save order to database
                            const insertQuery = `INSERT INTO "order" (item_number) VALUES (?)`;
                            db.run(insertQuery, [item_number], (err) => {
                                if (err) {
                                    console.error('Error inserting data into database:', err.message);
                                } else {
                                    console.log('Order inserted successfully');
                                }
                            });

                            const purchaseResult = { message: 'Purchase completed' };

                            // Cache the result
                            orderCache.set(item_number, purchaseResult);

                            res.json(purchaseResult);
                        })
                        .catch((error) => {
                            console.error("Error updating stock:", error);
                            res.status(500).json({ message: 'Error updating stock' });
                        });
                } else {
                    const outOfStockResult = { message: 'Item is sold out' };

                    // Cache the result
                    orderCache.set(item_number, outOfStockResult);

                    res.json(outOfStockResult);
                }
            } catch (error) {
                console.error("Failed to parse JSON:", error, responseData);
                res.status(500).json({ message: 'Error parsing item info' });
            }
        });
    }).on('error', (error) => {
        console.error("Error fetching item info:", error.message);
        res.status(500).json({ message: 'Error fetching item info' });
    });
});

app.listen(port, () => {
    console.log(`Order server is running at ${port}`);
});
