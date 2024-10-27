const express = require('express');
const db= require('./Database.js');
const app = express();
const port = 5000;


app.use(express.json());

app.get('/search/:Topic',(req,res)=>{  

    db.SearchTopic(req.params.Topic , (err , data) => {                 
        if (err) {
            res.status(500).send('Error fetching data from database');      
        } else {
            res.json(data);    
            console.log('Fetched successfully');
            console.log(data);
        }
    });
})

app.get('/info/:Itemid',(req,res)=>{  

    db.Info(req.params.Itemid , (err , data) => {                 
        if (err) {
            res.status(500).send('Error fetching data from database');      
        } else {
            res.json(data);    
            console.log('Fetched successfully');
            console.log(data);
        }
    });
})

app.put('/update/:item_number',(req,res)=>{                                     // to update the stock of an item
    stock = req.body.Stock;                                                     //extract the stock from the body
    console.log(req.body.Stock);
    db.updateStock(stock,req.params.item_number, (err) => {         //call the updateStock method from databaseconfig to update the stock of the item

        if (err) {
            res.status(500).send('Error fetching data from database');          //error handling
        } else {
            res.status(200).send('Updated');
        }
    });
})

app.listen(port,()=>{  
    console.log("Catalog server is running at 5000");                  
})