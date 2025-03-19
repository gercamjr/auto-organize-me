# Auto Organize Me - Design Document

## 1. Project Overview

**Auto Organize Me** is an Expo Android application designed specifically for car mechanics to manage client information, vehicle details, and job records. The app aims to streamline workflows, maintain accurate records, and improve client communication and service tracking.

## 2. Target Users

- Independent car mechanics
- Small auto repair shops
- Mobile mechanics
- Specialty auto technicians

## 3. Core Functionality

### 3.1 Client Management

- Store and manage client contact information
- Track client history and preferences
- Enable quick communication with clients
- Organize clients by activity level or relationship

### 3.2 Vehicle Management

- Associate multiple vehicles with each client
- Track vehicle details (make, model, year, VIN, etc.)
- Record vehicle service history
- Store vehicle photos and documents

### 3.3 Job/Service Management

- Create and manage job records
- Track job status (scheduled, in progress, completed, invoiced)
- Document parts used, labor hours, and costs
- Link jobs to clients and their vehicles
- Set up recurring maintenance reminders

### 3.4 Business Operations

- Generate invoices and estimates
- Track payments
- Schedule appointments
- Send automated reminders

## 4. Technical Architecture

### 4.1 Frontend

- **Framework**: React Native via Expo
- **Language**: TypeScript
- **UI Components**: React Native Paper or Native Base
- **Navigation**: React Navigation

### 4.2 Backend/Data Storage

- **Local Storage**: SQLite for offline functionality
- **State Management**: React Context API with hooks
- **Data Synchronization**: Optional cloud sync when internet is available

### 4.3 Security

- Authentication for app access
- Encrypted local storage
- Data backup capabilities

## 5. Data Models

### 5.1 Client Model

```typescript
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Vehicle Model

```typescript
interface Vehicle {
  id: string;
  clientId: string; // Reference to the owner
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate?: string;
  vin?: string;
  engineType: string; // Required as per client specifications
  engineDetails?: {
    displacement?: string;
    horsepower?: number;
    fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other';
    cylinderCount?: number;
    turboCharged?: boolean;
  };
  transmission: 'automatic' | 'manual' | 'cvt' | 'dct' | 'other'; // Required as per client specifications
  transmissionDetails?: {
    speeds?: number;
    manufacturer?: string;
    fluidType?: string;
  };
  mileage?: number;
  photos: string[]; // Paths to stored images - Required as per client specifications
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 Job Model

```typescript
interface Job {
  id: string;
  clientId: string;
  vehicleId: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'invoiced' | 'paid' | 'canceled';
  jobType: 'repair' | 'maintenance' | 'diagnosis' | 'estimate' | 'other';
  isHomeVisit: boolean; // Flag for at-home visits
  location?: {
    address: string;
    notes?: string;
  };
  scheduledDate?: Date;
  startDate?: Date;
  completionDate?: Date;
  parts: Part[]; // Detailed parts with warranty tracking
  diagnosticResults: DiagnosticItem[]; // Added for tracking diagnostic results
  laborDetails: LaborEntry[]; // For different labor rates and tasks
  estimateProvided: boolean;
  estimateAccepted?: boolean;
  estimateAmount?: number;
  totalCost: number;
  invoiceNumber?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: string;
  notes?: string;
  photos: string[]; // Required as per client specifications
  beforePhotos?: string[]; // Before repair photos
  afterPhotos?: string[]; // After repair photos
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.4 Part Model

```typescript
interface Part {
  id: string;
  jobId: string;
  name: string;
  partNumber?: string;
  manufacturer?: string;
  quantity: number;
  unitCost: number;
  markupPercentage?: number;
  clientPrice: number;
  totalCost: number;
  supplier?: string;
  warranty: {
    // Required as per client specifications
    hasCoverage: boolean;
    lengthInMonths?: number;
    lengthInMiles?: number;
    expirationDate?: Date;
    notes?: string;
    documentPhotos?: string[];
  };
  replacedPartCondition?: string;
  isClientSupplied?: boolean;
  notes?: string;
  photos?: string[];
}
```

### 5.6 Labor Entry Model

```typescript
interface LaborEntry {
  id: string;
  jobId: string;
  description: string;
  hours: number;
  rate: number; // Different rates for different tasks
  totalCost: number;
  technician?: string; // For future multi-user support
  notes?: string;
}
```

### 5.7 Diagnostic Item Model

```typescript
interface DiagnosticItem {
  id: string;
  jobId: string;
  system: string; // e.g., "Electrical", "Engine", "Transmission"
  component: string;
  issue: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  recommendedAction: string;
  estimatedCost?: number;
  photos?: string[];
  notes?: string;
}
```

### 5.5 Appointment Model

```typescript
interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  scheduledDate: Date;
  duration: number; // In minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no-show';
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 6. UI/UX Design

### 6.1 Navigation Structure

- Bottom tab navigation for primary sections:
  - Clients
  - Vehicles
  - Jobs
  - Appointments
  - Settings

### 6.2 Key Screens

#### Client Screens

- Client List
- Client Details
- Add/Edit Client
- Client Vehicles List

#### Vehicle Screens

- Vehicle List
- Vehicle Details
- Add/Edit Vehicle (with detailed engine and transmission specifications)
- Vehicle Service History
- Vehicle Photo Gallery

#### Job Screens

- Job List (with filters)
- Job Details
- Create/Edit Job
- Home Visit Job Creation (with location input)
- Estimate Creation
- Parts List
- Add/Edit Parts (with warranty details)
- Diagnostic Results Entry
- Labor Entries
- Job Photo Management (before/after categorization)

#### Appointment Screens

- Calendar View
- Appointment List
- Create/Edit Appointment
- Home Visit Scheduling (with location)

#### Invoice & Payment Screens

- Create Invoice
- Invoice Preview
- Payment Collection
- Payment History
- Receipt Generation

#### Other Screens

- Dashboard/Home
- Settings
- Reports
- Backup/Restore
- Photo Management

### 6.3 Design Principles

- Clean, professional interface
- Mechanic-friendly (usable with dirty/greasy hands)
- Large touch targets
- High contrast for outdoor visibility
- Quick-access to frequently used functions

## 7. Feature Prioritization (MoSCoW)

### 7.1 Must Have

- Client CRUD operations
- Vehicle CRUD operations (with detailed engine/transmission specs)
- Job CRUD operations (including at-home visits)
- Photo capture and storage for vehicles and repairs
- Diagnostic results tracking
- Part details with warranty information
- Labor tracking with different rates
- Estimate generation
- Basic reporting
- Local data storage

### 7.2 Should Have

- Appointment scheduling
- Job status tracking
- Simple invoicing and payment tracking
- Home visit location management
- Before/after photo comparisons
- Backup/restore functionality

### 7.3 Could Have

- Recurring maintenance reminders
- Parts inventory management
- Voice notes
- Cloud synchronization
- Multi-user foundation (for future expansion)
- Advanced invoice customization

### 7.4 Won't Have (Initially)

- Online payment processing
- Customer portal
- Integration with accounting software
- Diagnostic tool integration
- Advanced multi-user permissions system

## 8. Development Roadmap

### Phase 1: Foundation

- Project setup with Expo and TypeScript
- Database schema and local storage implementation
- Basic navigation structure
- Authentication system

### Phase 2: Core Functionality

- Client management features
- Vehicle management features
- Basic job tracking

### Phase 3: Enhanced Features

- Appointments and scheduling
- Invoicing and estimates
- Photo attachments
- Reporting

### Phase 4: Advanced Features

- Data backup and restore
- Notifications and reminders
- Settings and customization

## 9. Technical Implementation Notes

### 9.1 Development Environment

- Expo SDK (latest stable version)
- TypeScript for type safety
- ESLint and Prettier for code quality
- Jest for testing

### 9.2 Key Libraries/Dependencies

- `expo-sqlite` for local database
- `react-navigation` for app navigation
- `react-native-paper` for UI components
- `date-fns` for date manipulation
- `expo-image-picker` for photo capture
- `expo-camera` for direct photo capture
- `expo-media-library` for photo management
- `expo-file-system` for file management
- `expo-print` for invoice and estimate printing
- `expo-sharing` for sharing documents
- `expo-location` for home visit location services
- `react-native-maps` for displaying job locations
- `expo-image-manipulator` for photo editing and compression

### 9.3 Database Structure

- SQLite database with appropriate indexes
- Regular backup mechanisms

### 9.4 Offline Functionality

- Full functionality without internet connection
- Optimistic UI updates
- Conflict resolution for future sync capabilities

## 10. Future Expansion Considerations

### 10.1 Potential Integrations

- Parts supplier catalogs
- Vehicle OBD/diagnostic systems
- Accounting software
- SMS/email notification services
- Digital payment processors
- Warranty tracking systems

### 10.2 Business Growth Features

- Multi-user support for shops with several mechanics
- Customer-facing appointment booking portal
- Advanced analytics and business intelligence
- Inventory management system
- Team member scheduling and task assignment
- Mobile payment acceptance
- Customer loyalty program

### 10.3 Invoicing and Payment System Expansion

- Invoice templates and customization
- Tax calculation and reporting
- Payment plan management
- Receipt automation
- Expense tracking for business operations
- Integration with accounting software

## 11. Testing Strategy

### 11.1 Unit Testing

- Test core business logic
- Data model validation
- Utility functions
- Photo management utilities
- Warranty tracking calculations
- Labor and parts cost calculations

### 11.2 Integration Testing

- Database operations
- Screen navigation
- Form submissions
- Camera and photo storage integration
- Location services for home visits
- Invoice generation system

### 11.3 User Testing

- Usability testing in field conditions (potentially with dirty/greasy hands)
- Performance testing under real conditions
- Battery usage optimization, especially with photo capture
- Testing on various Android devices
- Testing invoice workflow with real clients
- Photo management workflow testing

## 12. Code Versioning & CI/CD Pipeline

### 12.1 Version Control

- GitHub repository: `auto-organize-me`
- Branch strategy:
  - `main`: Production-ready code
  - `develop`: Integration branch for features
  - `feature/*`: Individual feature branches
  - `bugfix/*`: Bug fix branches
  - `release/*`: Release preparation branches

### 12.2 CI/CD Pipeline

- GitHub Actions for automation
- Workflow stages:
  - **Build**: Compile TypeScript, bundle assets
  - **Test**: Run unit and integration tests
  - **Code Quality**: TypeScript linting, code style checks
  - **Build APK**: Generate Android build
  - **Release**: Create GitHub release with versioned APK

### 12.3 Versioning Strategy

- Semantic versioning (MAJOR.MINOR.PATCH)
- Automated version bumping based on commit messages
- Changelog generation

### 12.4 Release Process

- Automated builds for develop branch (beta/testing)
- Manual approval for production releases
- Release notes generation
- APK distribution

## 13. Maintenance Plan

- Regular dependency updates
- Database schema migration strategy
- Feature deprecation process
- User feedback mechanisms
- Security patches and updates

## 14. Conclusion

The Auto Organize Me app provides an integrated solution for independent car mechanics to manage all aspects of their business. By focusing on core functionality first and implementing a clean, mechanic-friendly interface, the app aims to improve organization, reduce administrative overhead, and enhance the mechanic's ability to provide excellent service to their clients.
