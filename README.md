# Survey Platform

A full-stack survey platform built with Next.js (frontend) and Node.js/Express (backend).

## Features

- User authentication (JWT-based)
- Survey creation and management
- Survey response collection
- Respondent tracking
- Analytics dashboard
- Real-time response tracking
- Mobile-responsive design

## Tech Stack

### Frontend
- Next.js 14
- React
- Tailwind CSS
- TypeScript
- Shadcn UI Components

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Mongoose ODM

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- pnpm (recommended) or npm

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd survey-platform
```

2. Install dependencies:
```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend
pnpm install
```

3. Environment Setup:
Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/survey-platform
JWT_SECRET=your-secret-key
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

4. Start the development servers:
```bash
# Start backend (from backend directory)
pnpm dev

# Start frontend (from root directory)
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Survey Endpoints

#### Create Survey
```http
POST /api/surveys
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Customer Feedback",
  "description": "Help us improve our services",
  "questions": [
    {
      "id": "q1",
      "type": "single-choice",
      "question": "How satisfied are you?",
      "options": ["Very", "Somewhat", "Not at all"],
      "required": true
    }
  ]
}
```

#### Get Surveys
```http
GET /api/surveys?page=1&limit=10&status=active
Authorization: Bearer <token>
```

#### Update Survey
```http
PUT /api/surveys/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "questions": [...]
}
```

#### Delete Survey
```http
DELETE /api/surveys/:id
Authorization: Bearer <token>
```

#### Publish Survey
```http
POST /api/surveys/:id/publish
Authorization: Bearer <token>
```

### Response Endpoints

#### Submit Response
```http
POST /api/responses/:id
Content-Type: application/json

{
  "respondent": {
    "email": "respondent@example.com",
    "name": "Jane Doe"
  },
  "answers": {
    "q1": "Very"
  }
}
```

#### Get Survey Responses
```http
GET /api/responses/:id/responses?page=1&limit=10
Authorization: Bearer <token>
```

### Analytics Endpoints

#### Get Survey Analytics
```http
GET /api/analytics/surveys/:id
Authorization: Bearer <token>
```

#### Get Question Analytics
```http
GET /api/analytics/surveys/:id/questions/:questionId
Authorization: Bearer <token>
```

#### Get Dashboard Analytics
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

## Testing

Run the test suite:
```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd ..
pnpm test
```

## Deployment

### Backend Deployment

1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Deploy to your preferred platform (e.g., Railway, Render, Heroku)
3. Set environment variables in your deployment platform
4. Update CORS_ORIGIN to your frontend URL

### Frontend Deployment

1. Update API endpoint in frontend environment variables
2. Deploy to Vercel or your preferred platform
3. Set environment variables in your deployment platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
