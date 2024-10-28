const express = require('express');
const http = require('http');
const axios = require('axios');   
const app = express();
const port = 3000;

app.get('/search/:Topic',(req,res)=>{ 

 try {
    http.get('http://catalog:5000/search/'+req.params.Topic,( response)=>{    // send to catalog server    
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
       http.get('http://catalog:5000/info/'+req.params.Itemid,( response)=>{       
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

   app.post('/purchase/:item_number', async (req,res)=>{                                                     
    try {
        const response = await axios.post(`http://order:4000/purchase/${req.params.item_number}`);      // make an http post req to order server using axios
        console.log('Orderd successfully');
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
 
})



app.listen(port,()=>{  
    console.log(`frontend server is running at ${port}`);                  
})

