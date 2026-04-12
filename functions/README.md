# E-Commerce Server (PostgreSQL)

This is the backend API server for the e-commerce application, now migrated from MongoDB to PostgreSQL.

## Setup Instructions

### 1. Install PostgreSQL
- Download and install PostgreSQL from https://www.postgresql.org/
- Create a database named `ecommerce`
- Note your PostgreSQL credentials (username, password, port)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
- Copy `.env.example` to `.env`
- Update the PostgreSQL settings:
```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=ecommerce
PG_USER=your_postgres_username
PG_PASSWORD=your_postgres_password
PG_SSL=false
```

### 4. Create Database Tables
Run the SQL schema to create all tables:
```bash
psql -U your_username -d ecommerce -f schema.sql
```
Or copy and paste the contents of `schema.sql` into your PostgreSQL client.

### 5. Seed Initial Data
```bash
npm run seed
```

This creates:
- Admin user: `admin@store.com` / `admin123`
- Test customer: `john@test.com` / `password123`

### 6. Start the Server
```bash
npm run dev  # Development with nodemon
npm start    # Production
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List active categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Orders
- `POST /api/orders` - Create order (customer)
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin)
- `GET /api/orders/admin/stats` - Dashboard stats (admin)

### Users (Admin)
- `GET /api/users` - List customers
- `GET /api/users/count` - Customer count
- `GET /api/users/:id` - Customer details with orders

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

### Messages
- `POST /api/messages` - Submit contact form
- `GET /api/messages` - List messages (admin)
- `PATCH /api/messages/:id` - Update message status (admin)
- `DELETE /api/messages/:id` - Delete message (admin)

### Config
- `GET /api/about` - Get about page content
- `PUT /api/about` - Update about page (admin)
- `GET /api/contact-config` - Get contact details
- `PUT /api/contact-config` - Update contact details (admin)

## Database Schema

The application uses the following tables:
- `users` - User accounts
- `categories` - Product categories
- `products` - Product catalog
- `orders` - Customer orders
- `chats` - Customer-admin chat messages
- `messages` - Contact form submissions
- `payment_configs` - Razorpay configuration
- `abouts` - About page content
- `contact_configs` - Contact information

## Migration Notes

This server has been migrated from MongoDB to PostgreSQL. Key changes:
- Mongoose models replaced with SQL queries using `pg` library
- Embedded arrays stored as JSONB columns
- Foreign key relationships enforced
- Stock management uses database transactions
- Text search uses PostgreSQL's full-text search capabilities