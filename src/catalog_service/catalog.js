const express = require('express');
const http = require('http');
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

app.listen(port,()=>{  
    console.log("Catalog server is running at 5000");                  
})