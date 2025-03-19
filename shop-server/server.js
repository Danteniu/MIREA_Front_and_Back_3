const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const WebSocket = require('ws');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Read products data
const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf8'));

// GraphQL Schema
const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    price: Float
    description: String
    categories: [String!]
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
    productsByCategory(category: String!): [Product!]!
    productNames: [String!]!
    productPrices: [Float!]!
    productDescriptions: [String!]!
  }
`);

// GraphQL Resolvers
const root = {
  products: () => products,
  product: ({ id }) => products.find(p => p.id === id),
  productsByCategory: ({ category }) => products.filter(p => p.categories.includes(category)),
  productNames: () => products.map(p => p.name),
  productPrices: () => products.map(p => p.price),
  productDescriptions: () => products.map(p => p.description)
};

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

// REST API endpoint (for backward compatibility)
app.get('/products', (req, res) => {
    res.json(products);
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Create HTTP server
const server = app.listen(PORT, () => {
    console.log(`Shop server running on http://localhost:${PORT}`);
});

// WebSocket server for chat
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        // Broadcast message to all connected clients
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'message',
                    sender: data.sender,
                    text: data.text,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });
}); 