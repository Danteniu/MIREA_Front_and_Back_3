const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Path to products.json
const productsPath = path.join(__dirname, '../data/products.json');

// Helper function to read products
const readProducts = () => {
    return JSON.parse(fs.readFileSync(productsPath, 'utf8'));
};

// Helper function to write products
const writeProducts = (products) => {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
};

// Get all products
app.get('/products', (req, res) => {
    try {
        const products = readProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error reading products' });
    }
});

// Add a single product
app.post('/products', (req, res) => {
    try {
        const products = readProducts();
        const newProduct = {
            id: Date.now().toString(), // Simple ID generation
            ...req.body
        };
        products.push(newProduct);
        writeProducts(products);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error adding product' });
    }
});

// Add multiple products
app.post('/products/batch', (req, res) => {
    try {
        const products = readProducts();
        const newProducts = req.body.map(product => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...product
        }));
        products.push(...newProducts);
        writeProducts(products);
        res.status(201).json(newProducts);
    } catch (error) {
        res.status(500).json({ error: 'Error adding products' });
    }
});

// Update a product
app.put('/products/:id', (req, res) => {
    try {
        const products = readProducts();
        const id = req.params.id;
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        products[index] = {
            ...products[index],
            ...req.body,
            id // Preserve the original ID
        };
        
        writeProducts(products);
        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ error: 'Error updating product' });
    }
});

// Delete a product
app.delete('/products/:id', (req, res) => {
    try {
        const products = readProducts();
        const id = req.params.id;
        const filteredProducts = products.filter(p => p.id !== id);
        
        if (filteredProducts.length === products.length) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        writeProducts(filteredProducts);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting product' });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Admin server running on http://localhost:${PORT}`);
}); 