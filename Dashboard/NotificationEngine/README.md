
```
src/
├── api/                   # API clients and data fetching
│   ├── auth.ts           # Authentication API functions
│   ├── services.ts       # Services CRUD API functions
│   ├── notifications.ts  # Notification API functions
│   ├── templates.ts      # Template API functions
│   └── dashboard.ts      # Dashboard statistics API
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   └── Select.tsx
│   └── layout/           # Layout components
│       ├── Layout.tsx
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── data/                 # Mock data for development
│   ├── notifications.json
│   ├── templates.json
│   └── auth.json
├── features/             # Feature-based modules
│   ├── auth/            # Authentication feature
│   │   ├── LoginPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/       # Dashboard feature
│   │   ├── DashboardPage.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── ChartSection.tsx
│   ├── notifications/   # Notifications feature
│   │   ├── NotificationsPage.tsx
│   │   ├── NotificationTable.tsx
│   │   ├── NotificationFilters.tsx
│   │   └── NotificationDetails.tsx
│   ├── templates/       # Templates feature
│   │   ├── TemplatesPage.tsx
│   │   ├── TemplateTable.tsx
│   │   ├── TemplateFilters.tsx
│   │   └── TemplateForm.tsx
│   └── services/        # Services feature
│       ├── ServicesPage.tsx
│       ├── ServicesTable.tsx
│       ├── ServiceForm.tsx
│       └── ServiceDetails.tsx
├── hooks/               # Custom React hooks
│   ├── useNotifications.ts
│   ├── useTemplates.ts
│   └── useDashboard.ts
├── store/               # Zustand stores
│   ├── useAuthStore.ts
│   ├── useServicesStore.ts
│   ├── useNotificationStore.ts
│   └── useTemplateStore.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NotificationEngine
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start development server**
   ```bash
   yarn dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Demo Credentials

The application now integrates with the real backend API. Use these credentials for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | ndikumanaphanuel@gmail.com | 1234 |

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3b82f6) - Main actions and branding
- **Secondary**: Green (#22c55e) - Success states and positive actions
- **Neutral**: Gray scale for text and backgrounds
- **Status Colors**: Red (errors), Yellow (warnings), Green (success)

### Typography
- **Font Family**: Inter (system font stack)
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, accessible contrast ratios

### Components
- **Consistent Spacing**: 4px base unit system
- **Border Radius**: 6px for cards, 8px for buttons
- **Shadows**: Subtle elevation system
- **Focus States**: Accessible keyboard navigation

## 🔧 Configuration

### Environment Variables
Create a `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=RISA Notification Engine
```

**Note**: 
- If `VITE_API_BASE_URL` is not set, the application will use `/api` in development (proxied to backend) and `http://127.0.0.1:8000/api` in production
- The Vite dev server is configured with a proxy to avoid CORS issues during development

### TailwindCSS Configuration
The project uses TailwindCSS v4 with custom theme configuration in `src/styles/globals.css`:

- Custom color palette defined using CSS custom properties
- Primary (blue) and secondary (green) color schemes
- No configuration file needed - all customizations in CSS

## 📊 Data Management

### Mock Data
The application uses mock JSON data for development:
- **Notifications**: 10 sample notifications with various statuses
- **Templates**: 12 notification templates across all types
- **Users**: 4 demo users with different roles

### State Management
- **Zustand Stores**: Client-side state for UI interactions
- **React Query**: Server state with caching and synchronization
- **Local Storage**: Persistent authentication state

## 🧪 Testing

### Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Test Structure
- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Feature-level testing
- **E2E Tests**: End-to-end user workflows

## 🚀 Deployment

### Build for Production
```bash
yarn build
```

### Preview Production Build
```bash
yarn preview
```

### Deployment Options
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

## 🔌 Backend Integration

### Real API Integration
The application now integrates with the RISA Notification Engine backend:

**Base URL**: Configured via `VITE_API_BASE_URL` environment variable (defaults to `http://127.0.0.1:8000/api`)

#### Authentication
- **Login Endpoint**: `POST /auth/signin/`
- **JWT Token Management**: Automatic token refresh and secure storage
- **Protected Routes**: All service endpoints require authentication

#### Services Management
- **Create Service**: `POST /services/`
- **Get All Services**: `GET /services/`
- **Get Single Service**: `GET /services/{id}/`
- **Update Service**: `PUT /services/{id}/`
- **Delete Service**: `DELETE /services/{id}/`

#### Features Implemented
- ✅ Real authentication with JWT tokens
- ✅ Complete CRUD operations for services
- ✅ Professional service management interface
- ✅ API key display and management
- ✅ Form validation and error handling
- ✅ Responsive design with modern UI

## 📈 Performance

### Optimization Features
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Large dataset handling
- **Image Optimization**: Lazy loading and responsive images

### Bundle Analysis
```bash
# Analyze bundle size
yarn build --analyze
```

## 🔒 Security

### Security Features
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation
- **Role-based Access**: Granular permission system

### Best Practices
- **Environment Variables**: Sensitive data in environment files
- **HTTPS Only**: Secure communication in production
- **Content Security Policy**: XSS attack prevention

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced code quality rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **TailwindCSS** - For the utility-first CSS approach
- **TanStack** - For excellent React Query library
- **Vite** - For the fast build tooling
- **Lucide** - For beautiful icons

## 🔧 Troubleshooting

### CORS Issues
If you encounter CORS errors when connecting to the backend:

1. **Development**: The Vite proxy should handle this automatically
2. **Production**: Ensure your backend has proper CORS headers configured
3. **Alternative**: Use the same origin for both frontend and backend

### Common Issues
- **Network errors**: Check if the backend server is running on the correct port
- **Authentication failures**: Verify the backend API endpoints are working
- **Build errors**: Run `yarn build` to check for TypeScript errors

## 📞 Support

For support and questions:
- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions

---

**Built with ❤️ for modern notification management**