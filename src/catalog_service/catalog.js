const express = require('express');
const db = require('./Database.js');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/search/:Topic', (req, res) => {

    db.SearchTopic(req.params.Topic, (err, data) => {
        if (err) {
            res.status(500).send('Error fetching data from database');
        } else {
            res.json(data);
            console.log('Fetched successfully');
            console.log(data);
        }
    });
})

app.get('/info/:Itemid', (req, res) => {

    db.Info(req.params.Itemid, (err, data) => {
        if (err) {
            res.status(500).send('Error fetching data from database');
        } else {
            res.json(data);
            console.log('Fetched successfully');
            console.log(data);
        }
    });
})

app.put('/update/:item_number', (req, res) => {
    stock = req.body.Stock;
    console.log(req.body.Stock);
    db.updateStock(stock, req.params.item_number, (err) => {

        if (err) {
            res.status(500).send('Error fetching data from database');
        } else {
            res.status(200).send('Updated');
        }
    });
})
// In the catalog service running on each replica (e.g., localhost:5000 or localhost:5001)
app.post('/updateCatalog/:item_number', async (req, res) => {
    const itemNumber = req.params.item_number;
    const updatedData = req.body;

    try {
        // Update the catalog data for the given item number
        // This can be a database update or a cache update depending on your architecture.
        // Assuming you're using a database or in-memory data structure
        const result = await catalogDatabase.update(itemNumber, updatedData);

        console.log(`Catalog updated for item ${itemNumber}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`Error updating catalog for item ${itemNumber}:`, error.message);
        res.status(500).json({ error: 'Failed to update catalog' });
    }
});

app.listen(port, () => {
    console.log(`Catalog server is running at ${port}`);
})