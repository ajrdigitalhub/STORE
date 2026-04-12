-- Create database (run this separately if needed)
-- CREATE DATABASE ecommerce;

-- Use the database
-- \c ecommerce;

-- Create tables

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    phone VARCHAR(20),
    address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    categoryid INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]'::jsonb,
    stock INTEGER DEFAULT 0,
    variants JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create text search index for products
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    userid INTEGER REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    payment_method VARCHAR(50) DEFAULT 'cod' CHECK (payment_method IN ('razorpay', 'cod')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    razorpay_orderid VARCHAR(255),
    razorpay_paymentid VARCHAR(255),
    razorpay_signature VARCHAR(500),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chats table
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    customerid INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    messages JSONB DEFAULT '[]'::jsonb,
    last_message TEXT,
    last_message_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (contact form)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Config table (singleton)
CREATE TABLE payment_configs (
    id SERIAL PRIMARY KEY,
    razorpay_keyid VARCHAR(255),
    razorpay_key_secret VARCHAR(255),
    merchant_name VARCHAR(255),
    merchant_logo VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- About table (singleton)
CREATE TABLE abouts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    description TEXT,
    mission TEXT,
    vision TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Config table (singleton)
CREATE TABLE contact_configs (
    id SERIAL PRIMARY KEY,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    working_hours TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_orders_userid ON orders(userid);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_chats_customerid ON chats(customerid);
CREATE INDEX idx_chats_is_active ON chats(is_active);
CREATE INDEX idx_products_categoryid ON products(categoryid);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);

-- Insert default configs if they don't exist
INSERT INTO payment_configs (razorpay_keyid, razorpay_key_secret, merchant_name, merchant_logo)
VALUES ('', '', '', '')
ON CONFLICT DO NOTHING;

INSERT INTO abouts (title, subtitle, description, mission, vision)
VALUES ('', '', '', '', '')
ON CONFLICT DO NOTHING;

INSERT INTO contact_configs (address, phone, email, working_hours)
VALUES ('', '', '', '')
ON CONFLICT DO NOTHING;