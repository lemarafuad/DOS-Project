const express = require('express');
const http = require('http');
const axios = require('axios');   
const LRU = require('lru-cache');  // LRU cache implementation
const app = express();
const port = 3000;

// Catalog and order replica endpoints
const catalogReplicas = ['http://catalog1:5000', 'http://catalog2:5000'];
const orderReplicas = ['http://order1:6000', 'http://order2:6000'];

// for round-robin load balancing
let catalogIndex = 0;   
let orderIndex = 0;


// Cache with LRU replacement policy
const cache = new LRU({ max: 100 }); 


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

  if (cache.has(topic)) {
    console.log('from cache');
    return res.json(cache.get(topic));
  }

  try {
    const replica = getCatalogReplica();
    const response = await axios.get(`${replica}/search/${topic}`);
    const topicData = response.data;

    cache.set(topic,topicData);
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
    if (cache.has(bookId)) {
      console.log('from cache');
      return res.json(cache.get(bookId));
    }
  
    try {
      // Forward request to catalog replica
      const replica = getCatalogReplica();
      const response = await axios.get(`${replica}/info/${bookId}`);
      const bookData = response.data;
  
      // Cache the response
      cache.set(bookId, bookData);
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

// Endpoint to place an order
/*app.post('/order', async (req, res) => {
    const { bookId, quantity } = req.body;
  
    try {
      const replica = getOrderReplica();
      const response = await axios.post(`${replica}/order`, { bookId, quantity });
      
      // Invalidate cache for updated book
      cache.del(bookId);
      
      res.json(response.data);
    } catch (error) {
      res.status(500).send('Error placing order');
    }
  });
*/
  
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

// Cache invalidation endpoint (called by catalog/order replicas)
app.post('/invalidate', (req, res) => {
  const bookId = req.body.id;
  cache.del(bookId);
  res.send(`Cache invalidated for book id: ${bookId}`);
});

app.listen(port,()=>{  
    console.log(`frontend server is running at ${port}`);                  
})

