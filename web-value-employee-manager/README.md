# Web Value Employee Manager

A full-stack employee task management system with admin control & calendar integration.

## Features

- 🔐 **Authentication & Access Control**
  - Domain-restricted login (@thewebvalue.com)
  - Admin-controlled user management
  - JWT authentication with bcrypt
  - Role-based access control

- 👥 **User Roles**
  - Admin Dashboard with full access
  - Employee Dashboard with restricted access
  - Task management and assignment

- 🗂️ **Tasks & Work Orders**
  - Comprehensive task management
  - Status tracking
  - Due date integration
  - Task timeline logging

- 📧 **Notifications**
  - Email notifications via SendGrid/Nodemailer
  - Calendar integration (Google & Microsoft)
  - Automated reminders

- 📊 **Analytics**
  - Task statistics
  - Employee performance metrics
  - Visual data representation

- 💻 **Modern Tech Stack**
  - Frontend: React + TailwindCSS + Framer Motion
  - Backend: Node.js + Express.js
  - Database: PostgreSQL
  - Authentication: JWT + bcrypt
  - Calendar: Google Calendar API & Microsoft Graph API

## Project Structure

```
├── backend/               # Node.js/Express backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Custom middlewares
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # External services integration
│   └── utils/           # Utility functions
│
├── frontend/            # React frontend
│   ├── public/         # Static files
│   └── src/
│       ├── components/ # React components
│       ├── context/    # React context
│       ├── i18n/       # Translations
│       ├── routes/     # Route components
│       └── utils/      # Utility functions
```

## Getting Started

### Prerequisites

- Node.js >= 14
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/web-value-employee-manager.git
cd web-value-employee-manager
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
```bash
# Backend .env
cp .env.example .env
# Edit .env with your configuration
```

5. Start the development servers
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm start
```

## Environment Variables

```env
# Backend
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_key
GOOGLE_CALENDAR_API_KEY=your_google_calendar_key
MICROSOFT_GRAPH_CLIENT_ID=your_microsoft_client_id
MICROSOFT_GRAPH_CLIENT_SECRET=your_microsoft_client_secret

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
