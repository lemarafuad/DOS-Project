const express = require('express');
const http = require('http');
const axios = require('axios');
const LRU = require('lru-cache');  // LRU cache implementation
const app = express();
const port = 3000;

// Catalog and order replica endpoints
const catalogReplicas = ['http://localhost:5000', 'http://localhost:5001'];
const orderReplicas = ['http://localhost:4000', 'http://localhost:4001'];

// for round-robin load balancing
let catalogIndex = 0;
let orderIndex = 0;


// Cache with LRU replacement policy
const catalogCache = new LRU({ max: 100 });  // Cache for catalog data
const orderCache = new LRU({ max: 100 });    // Cache for order data

// Simple round-robin load balancer
// function getCatalogReplica() {
//   const replica = catalogReplicas[catalogIndex];
//   console.log(`Selected catalog replica: ${replica} (index: ${catalogIndex})`);
//   catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
//   return replica;
// }
function getCatalogReplica() {
  const replica = catalogReplicas[catalogIndex];
  console.log(`Selected catalog replica: ${replica} (index: ${catalogIndex})`);
  catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
  return replica;
}


function getOrderReplica() {
  const replica = orderReplicas[orderIndex];
  console.log(`Selected order replica: ${replica} (index: ${orderIndex})`);
  orderIndex = (orderIndex + 1) % orderReplicas.length;
  return replica;
}



app.get('/search/:Topic', async (req, res) => {
  const topic = req.params.Topic;

  if (catalogCache.has(topic)) {
    console.log('Fetched from cache');
    return res.json(catalogCache.get(topic));
  }

  try {
    const replica = getCatalogReplica();
    const response = await axios.get(`${replica}/search/${topic}`);
    // print port
    const replicaPort = new URL(replica).port;
    console.log(`I fetched all books with topic ${topic} Using replica on port: ${replicaPort}`);
    const topicData = response.data;

    catalogCache.set(topic, topicData);
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
    console.log('Fetched from cache');
    return res.json(catalogCache.get(bookId));
  }

  try {
    // Forward request to catalog replica
    const replica = getCatalogReplica();
    const response = await axios.get(`${replica}/info/${bookId}`);
    const replicaPort = new URL(replica).port;
    console.log(`I fetched the book with id ${bookId} Using replica on port: ${replicaPort}`);

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

  // First, invalidate the order cache, if it exists
  if (orderCache.has(itemNumber)) {
    console.log('Fetched from order cache');
    orderCache.del(itemNumber); // Invalidate order cache
  }

  try {
    // Use round-robin to pick the replica for the order service
    const replica = getOrderReplica();
    const replicaPort = new URL(replica).port; // Extract port for logging
    console.log(`Using order replica on port: ${replicaPort}`);

    // Make the HTTP POST request to the selected order replica
    const response = await axios.post(`${replica}/purchase/${itemNumber}`);
    const purchaseData = response.data;

    // Store the purchase data in the order cache
    orderCache.set(itemNumber, purchaseData);
    console.log('Purchase made successfully and cached:', purchaseData);

    // After making a purchase, invalidate the relevant catalog cache and refresh it
    if (catalogCache.has(itemNumber)) {
      catalogCache.del(itemNumber); // Invalidate catalog cache entry for the item
      console.log(`Invalidated catalog cache for item ${itemNumber}`);
    }

    // Select a single catalog replica for refresh
    const replicaForCatalog = getCatalogReplica(); // Select one catalog replica
    console.log(`Selected catalog replica for refresh: ${replicaForCatalog}`);

    // Re-fetch updated data from the catalog service
    const catalogResponse = await axios.get(`${replicaForCatalog}/info/${itemNumber}`);
    console.log(`Catalog data fetched for item ${itemNumber}:`, catalogResponse.data);
    const updatedCatalogData = catalogResponse.data;

    // Check the stock value before updating cache
    console.log(`Updated stock for item ${itemNumber}:`, updatedCatalogData[0].Stock);

    // Update the catalog cache with the new data
    catalogCache.set(itemNumber, updatedCatalogData);
    console.log('Catalog data updated and cached:', updatedCatalogData);

    // Attempt to update the catalog on the selected replica
    try {
      console.log(`Updating catalog on replica ${replicaForCatalog}...`);
      const updateResponse = await axios.post(`${replicaForCatalog}/updateCatalog/${itemNumber}`, updatedCatalogData);

      if (updateResponse.status === 200) {
        console.log(`Catalog updated successfully on replica ${replicaForCatalog}`);
      } else {
        console.error(`Failed to update catalog on replica ${replicaForCatalog}:`, updateResponse.status);
      }
    } catch (error) {
      console.error(`Error while updating catalog on replica ${replicaForCatalog}:`, error.message);
    }

    // Send the purchase data as the response
    res.json(purchaseData);

  } catch (error) {
    console.error('Error in purchase process:', error.message);
    res.status(500).json({ error: error.message });
  }
});



app.listen(port, () => {
  console.log(`frontend server is running at ${port}`);
})

