# Memory Assistant

A feature-rich Memory App for Biblical Verse Memorization with speech recognition capabilities.

## Features

- User Authentication (Firebase)
- Passage Storage and Management
- Grading System with Real-time Feedback
- Progress Tracking and Visualization
- Anonymous Leaderboard
- Speech Recognition for Verse Input

## Tech Stack

- Frontend: React + TypeScript
- Backend: Firebase (Authentication, Firestore)
- UI Framework: Material-UI
- Charts: Chart.js with react-chartjs-2
- Routing: React Router
- HTTP Client: Axios

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/     # React components
├── contexts/       # React contexts
├── firebase/       # Firebase configuration
├── hooks/         # Custom hooks
├── pages/         # Page components
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## License

MIT
