# Auto Organize Me

An Expo/React Native Android application designed for car mechanics to manage clients, vehicles, jobs, and appointments.

## Features

- **Client Management**: Store contact details and history
- **Vehicle Management**: Track detailed vehicle specifications including engine and transmission details
- **Job Management**: Create repair records with parts, labor, and diagnostics
- **Appointment Scheduling**: Manage scheduling including at-home visits
- **Photo Documentation**: Capture and organize photos of vehicles and repairs
- **Invoicing**: Generate estimates and invoices
- **Offline First**: Works without internet connection

## Tech Stack

- **Framework**: React Native via Expo
- **Language**: TypeScript
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **Database**: SQLite (expo-sqlite)
- **State Management**: React Context API

## Getting Started

### Coding Standards

- Follow the TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write unit tests for business logic
- Follow the repository pattern for database operations
- Use descriptive variable and function names

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `bugfix/*`: Bug fix branches
- `release/*`: Release preparation branches

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. **Validate**: Runs linting, type checking, and tests
2. **Build**: Creates an Android APK using Expo EAS Build
3. **Release**: Tags a new version and creates a GitHub release

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [x] Core client and vehicle management
- [x] Job tracking with parts and labor
- [x] Appointment scheduling
- [ ] Enhanced photo management
- [ ] Cloud synchronization
- [ ] Multi-user support
- [ ] Customer portal
- [ ] Integration with parts catalogs
- [ ] Integration with accounting software

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/your-username/auto-organize-me](https://github.com/your-username/auto-organize-me) Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator)
- Physical Android device (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/auto-organize-me.git
   cd auto-organize-me
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Run on Android:
   - Press `a` in the terminal to run on an Android emulator
   - Or scan the QR code with the Expo Go app on your physical device

## Development

### Project Structure

```
auto-organize-me/
├── assets/               # Static assets
├── src/
│   ├── api/              # API related code
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React Context providers
│   ├── database/         # SQLite database setup and queries
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Application screens
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── .github/              # GitHub Actions workflows
└── README.md
```

### Database Schema

The application uses SQLite for local data storage with the following main tables:

- `clients` - Client information
- `vehicles` - Vehicle details with engine and transmission specifics
- `jobs` - Service/repair records
- `parts` - Parts used in repairs with warranty tracking
- `labor_entries` - Labor charges
- `diagnostic_items` - Diagnostic findings
- `appointments` - Scheduled appointments
- Various photo tables for storing photo references

###
