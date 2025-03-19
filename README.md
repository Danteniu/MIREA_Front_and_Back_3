# Приложение интернет-магазина

## Структура проекта

- `frontend/` - Содержит фронтенд магазина
- `shop-server/` - Бэкенд-сервер магазина (порт 5000)
- `admin-server/` - Бэкенд-сервер панели администратора (порт 8080)
- `data/` - Содержит данные о товарах

## Требования

- Node.js
- npm

## Инструкции по установке

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Установите зависимости для обоих серверов:
```bash
# Установка зависимостей для сервера магазина
cd shop-server
npm install

# Установка зависимостей для сервера администратора
cd ../admin-server
npm install
```

3. Запустите серверы:

В первом терминале:
```bash
cd shop-server
npm start
```

В другом терминале:
```bash
cd admin-server
npm start
```

## Доступ к приложению

- Фронтенд магазина: http://localhost:5000
- Панель администратора: http://localhost:8080
- GraphQL Playground: http://localhost:5000/graphql

## Функциональность

### Фронтенд магазина
- Отображение товаров в виде сетки
- Фильтрация товаров по категориям
- Адаптивный дизайн
- Карточки товаров с названием, ценой и описанием
- Чат поддержки с администратором
- GraphQL запросы для получения данных

### Панель администратора
- Добавление новых товаров
- Редактирование существующих товаров
- Удаление товаров
- Просмотр всех товаров
- Управление категориями товаров
- Чат поддержки с пользователями

## API Endpoints

### Сервер магазина (Порт 5000)
#### GraphQL API
- `GET /graphql` - GraphQL endpoint с поддержкой следующих запросов:
  ```graphql
  query {
    products {
      id
      name
      price
      description
      categories
    }
    product(id: ID!) {
      id
      name
      price
      description
      categories
    }
    productsByCategory(category: String!) {
      id
      name
      price
      description
      categories
    }
    productNames: [String!]!
    productPrices: [Float!]!
    productDescriptions: [String!]!
  }
  ```

#### WebSocket API
- `ws://localhost:5000` - WebSocket endpoint для чата поддержки
  - События:
    - `message`: Отправка и получение сообщений
    - `connection`: Подключение клиента
    - `close`: Отключение клиента

### Сервер администратора (Порт 8080)
#### REST API
- `GET /products` - Получить все товары
- `POST /products` - Добавить новый товар
- `POST /products/batch` - Добавить несколько товаров
- `PUT /products/:id` - Обновить товар
- `DELETE /products/:id` - Удалить товар

## Категории товаров

В приложении есть две основные категории:
- Электроника
- Гаджеты

Товары могут принадлежать к одной или обеим категориям.

## Чат поддержки

Чат поддержки реализован с использованием WebSocket и доступен как в интерфейсе магазина, так и в панели администратора. Особенности:
- Всплывающее окно в интерфейсе магазина
- Встроенный чат в панели администратора
- Различение сообщений пользователей и администраторов
- Автоматическая прокрутка к новым сообщениям
- Поддержка отправки сообщений по Enter 
