const express = require('express');
const http = require('http');
const axios = require('axios');   
const LRU = require('lru-cache');  // LRU cache implementation
const app = express();
const port = 3000;

// Catalog and order replica endpoints
const catalogReplicas = ['http://catalog1:5000', 'http://catalog2:5001'];
const orderReplicas = ['http://order1:4000', 'http://order2:4001'];

// for round-robin load balancing
let catalogIndex = 0;   
let orderIndex = 0;


// Cache with LRU replacement policy
const catalogCache = new LRU({ max: 100 });  // Cache for catalog data

// Simple round-robin load balancer
function getCatalogReplica() {
    const replica = catalogReplicas[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return replica;
  }
  
  function getOrderReplica() {
    const replica = orderReplicas[orderIndex];
    orderIndex = (orderIndex + 1) % orderReplicas.length;
    return replica;
  }


app.get('/search/:Topic', async (req, res) => {
  const topic = req.params.Topic;

  if (catalogCache.has(topic)) {
    console.log('from cache');
    return res.json(catalogCache.get(topic));
  }

  try {
    const replica = getCatalogReplica();
    const response = await axios.get(`${replica}/search/${topic}`);
    // print port
    const replicaPort = new URL(replica).port; 
    console.log(`Using replica catalog on port: ${replicaPort}`);
    const topicData = response.data;

    catalogCache.set(topic,topicData);
    res.json(topicData);
    console.log('Fetched from catalog and cached');
  } catch (error) {
    res.status(500).send('Error fetching catalog data');
  }
});

/*app.get('/search/:Topic',(req,res)=>{ 

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
})*/


app.get('/info/:Itemid', async (req, res) => {
    const bookId = req.params.Itemid;
  
    // Check cache first
    if (catalogCache.has(bookId)) {
      console.log('from cache');
      return res.json(catalogCache.get(bookId));
    }
  
    try {
      // Forward request to catalog replica
      const replica = getCatalogReplica();
        // print port
    const replicaPort = new URL(replica).port; 
    console.log(`Using replica catalog on port: ${replicaPort}`);
      const response = await axios.get(`${replica}/info/${bookId}`);
      const bookData = response.data;
  
      // Cache the response
      catalogCache.set(bookId, bookData);
      res.json(bookData);
      console.log('Fetched from catalog and cached');
    } catch (error) {
      res.status(500).send('Error fetching catalog data');
    }
  });

/*app.get('/info/:Itemid',(req,res)=>{ 

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
*/



/*app.post('/purchase/:item_number', async (req,res)=>{                                                     
    try {
        const response = await axios.post(`http://order:4000/purchase/${req.params.item_number}`);      // make an http post req to order server using axios
        console.log('Orderd successfully');
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
 
})*/

app.post('/purchase/:item_number', async (req, res) => {
  const itemNumber = req.params.item_number;

  try {
    // Check cache
     if (catalogCache.has(itemNumber)) {
    catalogCache.del(itemNumber);  // Delete outdated cache
    console.log('delet old data from cache');
     }

    // Use replica
    const replica = getOrderReplica();
    const replicaPort = new URL(replica).port; 
    console.log(`Using replica on port: ${replicaPort}`);

    const response = await axios.post(`${replica}/purchase/${itemNumber}`);
    const purchaseData = response.data;

    // Store the response in the cache
    catalogCache.set(itemNumber, purchaseData);
    console.log('Ordered successfully and cached:', purchaseData);

    // Send response to the client
    res.json(purchaseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(port,()=>{  
    console.log(`frontend server is running at ${port}`);                  
})

