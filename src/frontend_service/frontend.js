const express = require('express');
const http = require('http');
const app = express();
const port = 3000;

app.get('/search/:Topic',(req,res)=>{ 

 try {
    http.get('http://localhost:5000/search/'+req.params.Topic,( response)=>{    // send to catalog server    
        response.on("data", (chunk)=>{
            const responseData = JSON.parse(chunk);                                  
            res.json(responseData)                                                   
            console.log('Fetched successfully');
            console.log(responseData);
        });     
})
    }catch (error) {                                                                
        res.status(500).json({ error: error.message });                            
    }
})

app.get('/info/:Itemid',(req,res)=>{ 

    try {
       http.get('http://localhost:5000/info/'+req.params.Itemid,( response)=>{       
           response.on("data", (chunk)=>{
               const responseData = JSON.parse(chunk);                                  
               res.json(responseData)                                                   
               console.log('Fetched successfully');
               console.log(responseData);
           });     
   })
       }catch (error) {                                                                
           res.status(500).json({ error: error.message });                            
       }
   })



app.listen(port,()=>{  
    console.log("Catalog server is running at 3000");                  
})

