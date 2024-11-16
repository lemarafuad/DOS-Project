const express = require('express');
const http = require('http');
const axios = require('axios');
const app = express();
const port = 3000;


const catalogServers = ['http://catalog1:5000', 'http://catalog2:5000'];
const orderServers = ['http://order1:4000', 'http://order2:4000'];
let catalogIndex = 0;
let orderIndex = 0;

function getNextCatalogServer() {
    const server = catalogServers[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogServers.length;
    return server;
}

function getNextOrderServer() {
    const server = orderServers[orderIndex];
    orderIndex = (orderIndex + 1) % orderServers.length;
    return server;
}

// Simple in-memory cache
const cache = new Map();

// Cache timeout in milliseconds (e.g., 5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Helper function to check and retrieve from cache
function getFromCache(key) {
    const cacheEntry = cache.get(key);
    if (cacheEntry && (Date.now() - cacheEntry.timestamp < CACHE_TIMEOUT)) {
        return cacheEntry.data;
    } else {
        cache.delete(key); // Remove expired cache
        return null;
    }
}

// Helper function to add data to cache
function addToCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

app.get('/search/:Topic', async (req, res) => {
    const cacheKey = `search_${req.params.Topic}`;
    const cachedData = getFromCache(cacheKey);

    if (cachedData) {
        console.log('Cache hit for search');
        return res.json(cachedData);
    }

    const catalogServer = getNextCatalogServer();

    try {
        const response = await axios.get(`${catalogServer}/search/${req.params.Topic}`);
        const data = response.data;
        addToCache(cacheKey, data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/info/:Itemid', async (req, res) => {
    const cacheKey = `info_${req.params.Itemid}`;
    const cachedData = getFromCache(cacheKey);

    if (cachedData) {
        console.log('Cache hit for info');
        return res.json(cachedData);
    }

    const catalogServer = getNextCatalogServer();

    try {
        const response = await axios.get(`${catalogServer}/info/${req.params.Itemid}`);
        const data = response.data;
        addToCache(cacheKey, data);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/purchase/:item_number', async (req, res) => {
    const orderServer = getNextOrderServer();

    try {
        const response = await axios.post(`${orderServer}/purchase/${req.params.item_number}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Frontend server is running at ${port}`);
});
