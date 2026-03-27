# E-Commerce Platform

A production-ready e-commerce platform built with Angular, Node.js, Express, and MongoDB.

## Features
- Complete custom metallic grayscale UI/UX with modern animations.
- Customer flow: Products, Cart, Checkout, Cash on Delivery, and Razorpay Payments.
- Admin Panel: Real-time Dashboard, Products, Categories, Orders, Customers.
- Real-time customer support chat powered by Socket.io.
- JWT authentication for Customers and Admins.

## Prerequisites
- Node.js (v18+)
- MongoDB running locally or on Atlas.
- Angular CLI installed globally (`npm i -g @angular/cli`).

## Setup Instructions

### 1. Database & Seeding
Ensure MongoDB is running locally on port `27017`.
Seed the database with test data:
```bash
cd server
npm run seed
```
*This creates an Admin user (admin@store.com / admin123) and a Customer (john@test.com / password123) with demo products.*

### 2. Run Backend
```bash
cd server
npm start
```
*Server runs on `http://localhost:5000`*

### 3. Run Frontend
```bash
cd client
ng serve
```
*Frontend runs on `http://localhost:4200`*

## Default Credentials
- **Admin Layout**: `http://localhost:4200/admin`
  - Email: `admin@store.com`
  - Password: `admin123`
- **Customer**: `http://localhost:4200/`
  - Email: `john@test.com`
  - Password: `password123`
