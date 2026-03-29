# E-Commerce Platform

A production-ready e-commerce platform built with Angular, Node.js, Express, and MongoDB, featuring a premium metallic design system.

## 🚀 Key Features
- **Featured Product Customization**: Customers can provide a custom name and upload an image for products tagged as "featured".
- **Metallic UI/UX**: Custom grayscale design system with modern glassmorphism and animations.
- **Complete Order Flow**: Cart, Checkout, COD, and Razorpay integration.
- **Admin Dashboard**: Real-time stats, order management, and product/category control.
- **Real-time Chat**: Customer-to-Admin support powered by Socket.io.
- **JWT Authentication**: Secure login for both customers and administrators.

## 🛠️ Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Angular CLI (`npm i -g @angular/cli`)

## 📋 Setup Instructions

### 1. Database Management
Ensure MongoDB is running locally on port `27017`.

**Seed the Database (Reset):**
```bash
cd server
node seed.js
```
*Clears all data and creates default accounts (admin@store.com / admin123 and john@test.com / password123).*

**Full Cleanup (Delete All):**
```bash
cd server
npm run cleanup
```

### 2. Run Backend
```bash
cd server
npm run dev
```
*Server runs on `http://localhost:5000`*

### 3. Run Frontend
```bash
cd client
ng serve
```
*Frontend runs on `http://localhost:4200`*

## 🔐 Default Credentials

| Role | Link | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `/admin` | `admin@store.com` | `admin123` |
| **Customer** | `/` | `john@test.com` | `password123` |

## 📁 Project Structure
- `client/`: Angular frontend application.
- `server/`: Node.js/Express backend API.
- `server/uploads/`: Directory for product and custom user images.
