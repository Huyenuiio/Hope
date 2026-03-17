# Hope Platform - Frontend

The modern, responsive web frontend for the Hope Platform. Built to provide a premium user experience for freelancers and clients to connect, share jobs, and message in real-time.

## ✨ Features

- **Professional Dashboard**: Personalized feed with job updates and social interactions.
- **Job Hub**: Dynamic job searching, filtering, and application tracking.
- **Real-time Messaging**: Complete inbox system with typing indicators, image sharing, and instant delivery.
- **Profile Management**: Detailed freelancer profiles with portfolio showcases and saved jobs.
- **Multilingual Support**: Built-in internationalization (English & Vietnamese).
- **Responsive Design**: Optimized for desktop and mobile with a sleek, premium UI.

## 🛠 Tech Stack

- **Core**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Real-time**: Socket.IO Client
- **i18n**: i18next & react-i18next
- **HTTP Client**: Axios

## 🔧 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd hope-platform-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   The app defaults to `http://localhost:5000/api` for the backend. You can override this by creating a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run the application**:
   ```bash
   # Development mode
   npm run dev

   # Build for production
   npm run build
   ```

## 📦 Project Structure

- `src/components` - Reusable UI components (Navbar, Modals, etc.)
- `src/pages` - Main page views (Dashboard, Messages, Jobs, Portfolio)
- `src/services` - API service layer and Socket.IO configuration
- `src/i18n` - Localization configurations
- `src/assets` - Images and static resources

## 📄 License

Private Project.
