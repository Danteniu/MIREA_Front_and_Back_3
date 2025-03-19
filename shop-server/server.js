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

// Функция для чтения данных о товарах
const readProducts = () => {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf8'));
};

// Переменная для хранения данных о товарах в памяти
let products = readProducts();

// GraphQL Schema
const schema = buildSchema(`
  # Тип товара
  type Product {
    id: ID!
    name: String!
    price: Float
    description: String
    categories: [String!]
    inStock: Boolean
    rating: Float
    reviews: [Review!]
    manufacturer: Manufacturer
  }

  # Тип отзыва
  type Review {
    id: ID!
    text: String!
    rating: Int!
    author: String!
    date: String!
  }

  # Тип производителя
  type Manufacturer {
    id: ID!
    name: String!
    country: String
    website: String
  }

  # Тип статистики
  type Statistics {
    totalProducts: Int!
    averagePrice: Float!
    categoriesCount: Int!
    inStockCount: Int!
  }

  # Входные данные для фильтрации
  input ProductFilter {
    minPrice: Float
    maxPrice: Float
    categories: [String!]
    inStock: Boolean
    minRating: Float
  }

  # Тип для результатов поиска
  type SearchResult {
    products: [Product!]!
    total: Int!
    hasMore: Boolean!
  }

  # Доступные запросы
  type Query {
    # Базовые запросы для товаров
    products: [Product!]!
    product(id: ID!): Product
    productsByCategory(category: String!): [Product!]!
    productNames: [String!]!
    productPrices: [Float!]!
    productDescriptions: [String!]!

    # Расширенные запросы
    searchProducts(
      filter: ProductFilter
      skip: Int = 0
      limit: Int = 10
    ): SearchResult!

    # Статистика магазина
    statistics: Statistics!

    # Поиск по производителям
    manufacturers: [Manufacturer!]!
    manufacturerProducts(manufacturerId: ID!): [Product!]!

    # Отзывы
    productReviews(productId: ID!): [Review!]!
    latestReviews(limit: Int = 5): [Review!]!
  }
`);

// GraphQL Resolvers
const root = {
  // Базовые резолверы
  products: () => products,
  product: ({ id }) => products.find(p => p.id === id),
  productsByCategory: ({ category }) => products.filter(p => p.categories.includes(category)),
  productNames: () => products.map(p => p.name),
  productPrices: () => products.map(p => p.price),
  productDescriptions: () => products.map(p => p.description),

  // Расширенные резолверы
  searchProducts: ({ filter, skip = 0, limit = 10 }) => {
    let filtered = [...products];

    // Применяем фильтры
    if (filter) {
      if (filter.minPrice != null) {
        filtered = filtered.filter(p => p.price >= filter.minPrice);
      }
      if (filter.maxPrice != null) {
        filtered = filtered.filter(p => p.price <= filter.maxPrice);
      }
      if (filter.categories && filter.categories.length > 0) {
        filtered = filtered.filter(p => 
          filter.categories.some(cat => p.categories.includes(cat))
        );
      }
      if (filter.inStock != null) {
        filtered = filtered.filter(p => p.inStock === filter.inStock);
      }
      if (filter.minRating != null) {
        filtered = filtered.filter(p => p.rating >= filter.minRating);
      }
    }

    return {
      products: filtered.slice(skip, skip + limit),
      total: filtered.length,
      hasMore: skip + limit < filtered.length
    };
  },

  // Статистика
  statistics: () => {
    const inStockProducts = products.filter(p => p.inStock);
    const allCategories = new Set(products.flatMap(p => p.categories));
    const totalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      totalProducts: products.length,
      averagePrice: totalPrice / products.length,
      categoriesCount: allCategories.size,
      inStockCount: inStockProducts.length
    };
  },

  // Производители
  manufacturers: () => {
    // В реальном приложении здесь был бы запрос к базе данных
    return [
      { id: "1", name: "Tech Corp", country: "USA", website: "techcorp.com" },
      { id: "2", name: "Gadget Inc", country: "Japan", website: "gadgetinc.jp" }
    ];
  },

  manufacturerProducts: ({ manufacturerId }) => 
    products.filter(p => p.manufacturer?.id === manufacturerId),

  // Отзывы
  productReviews: ({ productId }) => {
    // В реальном приложении здесь был бы запрос к базе данных
    return [
      {
        id: "1",
        text: "Отличный товар!",
        rating: 5,
        author: "Иван",
        date: new Date().toISOString()
      }
    ];
  },

  latestReviews: ({ limit }) => {
    // В реальном приложении здесь был бы запрос к базе данных
    return [
      {
        id: "1",
        text: "Отличный товар!",
        rating: 5,
        author: "Иван",
        date: new Date().toISOString()
      }
    ].slice(0, limit);
  }
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

// WebSocket server for chat and admin notifications
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
    console.log('New connection:', req.url);
    // Проверяем, является ли подключение административным
    if (req.url === '/admin') {
        ws.isAdmin = true;
        console.log('Admin connected');
    } else {
        clients.add(ws);
        console.log('Client connected');
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            if (ws.isAdmin && data.type === 'productsUpdated') {
                console.log('Updating products from admin');
                // Обновляем данные о товарах в памяти
                products = readProducts();
                
                // Уведомляем всех клиентов об обновлении
                const updatedProducts = readProducts();
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'productsUpdated',
                            products: updatedProducts
                        }));
                    }
                });
            } else {
                // Обычные сообщения чата
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
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        if (!ws.isAdmin) {
            clients.delete(ws);
            console.log('Client disconnected');
        } else {
            console.log('Admin disconnected');
        }
    });
}); 