# AMPRO License System - Frontend

A modern, clean frontend application for the AMPRO License System, providing a user interface for processing driver's licenses, managing citizens, and handling applications.

## Features

- **Authentication and User Management**: Secure login, role-based access control
- **Dashboard**: Overview of system status, recent activities, and pending tasks
- **Citizen Management**: Register, search, and manage citizen information
- **License Processing**: Create, view, print, and manage driver's licenses
- **Application Processing**: Submit and review license applications
- **Transaction Tracking**: View transaction history and audit logs

## Tech Stack

- **Framework**: React with TypeScript
- **UI Library**: Material UI
- **State Management**: React Query + Context API
- **Form Handling**: React Hook Form with Yup validation
- **Routing**: React Router
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ampro-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
REACT_APP_API_URL=https://ampro-licence.onrender.com
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── api/          # API services
├── assets/       # Static assets
├── components/   # Reusable components
├── contexts/     # React context providers
├── hooks/        # Custom hooks
├── layouts/      # Page layouts
├── pages/        # Top-level pages
├── types/        # TypeScript interfaces
├── utils/        # Utility functions
├── App.tsx       # Main application component
└── index.tsx     # Entry point
```

## Authentication

The application uses JWT-based authentication with access and refresh tokens. The authentication flow is handled in the `AuthContext` provider, which manages user state and token refreshing.

## API Integration

The application connects to the AMPRO License System backend API, with endpoints documented in the Swagger UI at `https://ampro-licence.onrender.com/api/v1/docs`.

## Deployment

1. Build the production version:
```bash
npm run build
```

2. Deploy the contents of the `build` directory to your hosting provider.

## License

This project is proprietary and confidential.

## Contact

 