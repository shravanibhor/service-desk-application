# Service Desk Application

A comprehensive full-stack service desk application built with React (frontend) and Node.js/Express (backend), featuring user authentication, ticket management, and admin dashboard capabilities.

## Features

### User Features
- **User Registration & Authentication** - Secure JWT-based authentication system
- **Ticket Creation** - Submit tickets with categories, priorities, and file attachments
- **Ticket Tracking** - Real-time status updates and progress monitoring
- **Communication** - Add comments and receive updates on tickets
- **Profile Management** - Update personal information and preferences
- **Responsive Design** - Mobile-first design for all devices

### Admin Features
- **Admin Dashboard** - Overview of system statistics and metrics
- **Ticket Management** - Assign, track, and resolve tickets efficiently
- **User Management** - Manage user accounts and permissions
- **Advanced Filtering** - Search and filter tickets by multiple criteria
- **Internal Comments** - Private communication between support staff
- **File Management** - Handle ticket attachments securely

### Technical Features
- **RESTful API** - Clean and well-documented API endpoints
- **Role-based Access Control** - Secure authorization system
- **File Upload Support** - Secure file attachment handling
- **Real-time Updates** - Live status updates and notifications
- **Data Validation** - Comprehensive input validation and sanitization
- **Error Handling** - Robust error handling and user feedback

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Helmet** - Security middleware
- **Express Validator** - Input validation and sanitization

### Frontend
- **React** - Modern JavaScript library for building user interfaces
- **Material-UI** - React component library for modern design
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Context API** - State management

## Project Structure

```
service-desk-app/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models
│   │   └── routes/         # API routes
│   ├── uploads/            # File uploads directory
│   ├── server.js           # Main server file
│   └── .env               # Environment variables
├── frontend/               # React frontend application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Context providers
│   │   ├── services/     # API service functions
│   │   └── utils/        # Utility functions
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd service-desk-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   - Copy `backend/.env.example` to `backend/.env`
   - Update the following variables:
     ```env
     MONGODB_URI=mongodb://localhost:27017/servicedesk
     JWT_SECRET=your-super-secret-jwt-key
     FRONTEND_URL=http://localhost:3000
     ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   This will start both the backend server (port 5000) and frontend development server (port 3000).

### Individual Setup

#### Backend Setup
```bash
cd backend
npm install
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Tickets
- `GET /api/tickets` - Get all tickets (with filtering)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get specific ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/comments` - Add comment to ticket
- `PUT /api/tickets/:id/assign` - Assign ticket (admin only)
- `GET /api/tickets/stats` - Get ticket statistics (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Deactivate user (admin only)
- `GET /api/users/support-staff` - Get support staff list
- `GET /api/users/dashboard` - Get dashboard data

## Usage

### For End Users
1. **Register/Login** - Create an account or log in with existing credentials
2. **Create Tickets** - Submit new service requests with detailed descriptions
3. **Track Progress** - Monitor ticket status and receive updates
4. **Communicate** - Add comments and provide additional information
5. **Manage Profile** - Update personal information and preferences

### For Administrators
1. **Dashboard Overview** - Monitor system statistics and ticket metrics
2. **Ticket Management** - Assign tickets to support staff and track progress
3. **User Management** - Manage user accounts and permissions
4. **System Monitoring** - Track system performance and user activity

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt encryption for password security
- **Input Validation** - Comprehensive data validation and sanitization
- **Rate Limiting** - Protection against brute force attacks
- **CORS Protection** - Cross-origin resource sharing configuration
- **Security Headers** - Helmet.js security middleware
- **File Upload Security** - Secure file handling with type and size restrictions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and FAQ sections

## Future Enhancements

- Email notifications for ticket updates
- Real-time chat support
- Advanced reporting and analytics
- Mobile application
- Integration with external ticketing systems
- Multi-language support
- Custom workflow configurations
