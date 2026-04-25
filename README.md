# IDEAZONE 3D - E-commerce Platform

A full-stack 3D printing e-commerce application built with Angular and Node.js. This platform allows users to browse 3D printed products, manage categories, place orders, and communicate via real-time chat.

## Tech Stack

### Frontend
- **Framework**: Angular (v21+)
- **State Management**: Angular Signals
- **Styling**: Tailwind CSS
- **Icons**: Angular Material Icons
- **Animations**: Motion (Vanilla JS)
- **Real-time**: Socket.io-client

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg`)
- **Real-time**: Socket.io
- **Authentication**: Firebase Admin SDK
- **File Uploads**: Multer
- **Payments**: Razorpay Integration

## Project Structure

The project uses **npm workspaces** to separate the frontend and backend concerns while maintaining a unified development experience.

```text
├── server/                 # Node.js Backend (Workspace)
│   ├── routes/             # API Route handlers
│   ├── app.js              # Express application setup
│   ├── main.js             # Server entry point
│   └── package.json        # Backend-specific dependencies
├── src/                    # Angular Frontend
│   ├── app/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level components
│   │   ├── services/       # Data services (ApiService, AuthService, etc.)
│   │   └── firebase.ts     # Firebase client configuration
│   └── environments/       # Environment-specific configurations
├── public/                 # Static assets and uploads
├── package.json            # Root configuration and UI dependencies
└── angular.json            # Angular CLI configuration
```

## Key Features

- **Centralized API Service**: All frontend HTTP calls are routed through a unified `ApiService` that handles base URL injection based on the environment.
- **Zoneless Angular**: Optimized performance using Angular's zoneless change detection and Signals.
- **Hybrid Workspace**: Clean separation between UI and Server dependencies using npm workspaces.
- **Real-time Chat**: Integrated support desk for users to communicate with admins.
- **Secure Payments**: Integrated Razorpay checkout flow.
- **Dynamic Configuration**: Admin-controlled hero slides, about content, and contact information.

## Getting Started

### Prerequisites
- Node.js (LTS version recommended)
- PostgreSQL database
- Firebase Project (for Authentication)

### Installation

1. Clone the repository.
2. Install dependencies for both workspaces:
   ```bash
   npm install
   ```

### Environment Setup

Create a `.env` file in the root directory (refer to `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string.
- `FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key.
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email.
- `RAZORPAY_KEY_ID`: Razorpay API Key.
- `RAZORPAY_KEY_SECRET`: Razorpay API Secret.

### Development

Run the development server (Frontend with HMR and Backend proxy):
```bash
npm run dev
```

### Production

1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## API Refactoring

The application uses a centralized `ApiService` located at `src/app/services/api.service.ts`. This service uses `environment.apiUrl` to determine the backend location:
- **Development**: `http://localhost:3000/api`
- **Production**: `/api` (relative to the served domain)
