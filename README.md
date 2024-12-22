# Memory Assistant

A web application to help users memorize and practice Bible verses using modern speech recognition technology.

## Features

- User Authentication
- Verse Management (Add, Edit, Delete)
- Practice Mode with Speech Recognition
- Real-time scoring and feedback
- Word-by-word comparison
- Support for both typing and speaking
- Cross-browser compatibility (Chrome, Firefox)

## Technology Stack

- React with TypeScript
- Material-UI for styling
- Firebase (Authentication, Firestore)
- Vite for build tooling
- Web Speech API for voice recognition

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd Memory_Assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase credentials in `.env.local`

4. Start the development server:
```bash
npm run dev
```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication and Firestore
3. Add your Firebase configuration to `.env.local`
4. Deploy Firestore security rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
