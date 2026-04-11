# 🎨 BlueVision

> **Advanced Digital Display Management Platform** — Control your entire digital signage ecosystem from one elegant, intuitive interface.

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Real--time%20Backend-3ECF8E?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Project Overview

**BlueVision** is a full-featured digital display management platform designed to streamline the deployment, monitoring, and scheduling of content across multiple digital displays. Whether you're managing retail signage, corporate dashboards, or information displays across multiple locations, BlueVision provides an enterprise-grade solution with an intuitive, modern user interface.

Transform how you manage digital content—from creation to deployment to real-time monitoring—all through a single, powerful platform backed by cutting-edge cloud infrastructure.

---

## ✨ Key Features

### 📊 **Intelligent Dashboard**
- Real-time system analytics and KPIs
- At-a-glance display status monitoring
- Quick access to recent activities and logs
- Role-based action summaries
- System health indicators

### 🖥️ **Display Management**
- Create and configure digital displays
- Monitor display health and connectivity status (online/offline/warning)
- Real-time status tracking and last-seen timestamps
- Display grouping and organization
- Remote display commands (reboot, refresh, screenshot, collect-logs)
- Multi-location support with geographic grouping

### 🎭 **Visual Layout Builder**
- **Drag-and-drop interface** for intuitive layout creation
- Multiple grid-based templates (1x3, 2x2, 1x4, and custom configurations)
- **Live preview** of layouts before publishing
- Zone-based media assignment with visual feedback
- Resolution and dimension tracking
- Draft and publish workflows

### 📁 **Media Library**
- Centralized media management and organization
- Support for multiple file types (images, videos, documents)
- Upload progress tracking
- Media metadata and versioning
- Search and filter capabilities
- Storage usage monitoring

### 📅 **Schedule Management**
- Time-based content scheduling
- Multi-display scheduling with bulk operations
- Campaign and content planning
- Calendar-based interface
- Schedule validation and conflict detection
- Recurring schedule support

### 🔐 **User & Access Control**
- Comprehensive role-based access control (RBAC)
- User profile management
- Permission-based action execution
- User activity audit trails
- Admin user management interface

### 🤖 **AI Assistant (Brinky)**
- Intelligent virtual assistant for platform guidance
- Contextual help and recommendations
- Quick access to platform features

### 🌓 **Theme Support**
- Light and dark mode support
- System theme detection
- Persistent user preferences
- Smooth theme transitions

### 📈 **Logging & Analytics**
- Comprehensive activity logging
- Historical data tracking
- Performance metrics
- User action tracking

---

## 🛠️ Technical Architecture

### Frontend Stack
```
├── React 18+ with TypeScript
│   └── Modern functional components with hooks
├── Vite
│   └── Lightning-fast build tool and dev server
├── React Router
│   └── Client-side routing with protected routes
├── React Query
│   └── Server state management & data synchronization
├── Tailwind CSS
│   └── Utility-first styling framework
├── shadcn/ui
│   └── High-quality, accessible component library
├── next-themes
│   └── Theme management and persistence
└── Zod
    └── TypeScript-first schema validation
```

### Backend Stack
```
├── Supabase (PostgreSQL)
│   ├── Real-time database
│   ├── Authentication
│   ├── Row-level security (RLS)
│   └── Edge Functions
├── Xibo CMS Integration
│   └── Professional digital signage backend
└── RESTful API
    └── Express-style middleware pattern
```

### Database Schema
```
Tables:
├── profiles
├── displays
├── layouts
├── layout_media
├── media
├── schedules
├── activity_logs
└── users
```

---

## 📦 Project Structure

```
BlueVision-codebase/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── auth/           # Authentication components
│   │   └── examples/       # Example implementations
│   ├── pages/              # Page-level components
│   │   ├── Dashboard.tsx
│   │   ├── Displays.tsx
│   │   ├── Layouts.tsx
│   │   ├── Schedules.tsx
│   │   ├── MediaLibrary.tsx
│   │   └── ...
│   ├── services/           # API & business logic
│   │   ├── XiboAPI.ts     # Xibo CMS integration
│   │   ├── userService.ts
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── use-date-picker.ts
│   │   └── ...
│   ├── stores/             # Zustand state management
│   │   ├── useAuthStore.ts
│   │   ├── useNotificationStore.ts
│   │   └── useTourStore.ts
│   ├── types/              # TypeScript interfaces & types
│   │   ├── display.ts
│   │   ├── layout-media.ts
│   │   ├── schedule.ts
│   │   └── ...
│   ├── lib/                # Utilities & libraries
│   │   ├── supabaseClient.ts
│   │   └── utils.ts
│   ├── middleware/         # Request/auth middleware
│   │   └── authorization.ts
│   ├── styles/             # Global CSS
│   └── App.tsx             # Main app component
├── supabase/               # Supabase configuration
│   ├── functions/          # Edge functions
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase config
├── server/                 # Backend logic (if applicable)
├── public/                 # Static assets
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS config
└── tsconfig.json           # TypeScript config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- PostgreSQL database connection

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/BlueVision.git
cd BlueVision-codebase
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local file
cp .env.example .env.local
```

Required environment variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_FUNCTION_URL=your_function_url
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting (if configured)
npm run lint
```

---

## 🔑 Key Features Deep Dive

### Displays Management
Create and configure digital displays with real-time monitoring. Track display health, manage display groups, and execute remote commands to control devices across your network.

**Key Capabilities:**
- Multi-location display organization
- Real-time health monitoring
- Remote device management
- Storage and resource tracking
- Connection status indicators

### Layout Designer
Build sophisticated multi-zone layouts with our intuitive visual builder. Preview content before publishing and manage different layout versions across your displays.

**Key Capabilities:**
- Template-based layout creation
- Drag-and-drop zone configuration
- Media assignment with live preview
- Multi-format support
- Resolution management

### Content Scheduling
Schedule specific content to display at specific times and on specific screens. Plan your content calendar with ease and ensure the right message reaches the right audience at the right time.

**Key Capabilities:**
- Time-based scheduling
- Multi-display campaigns
- Campaign planning
- Schedule validation
- Recurring content support

### Media Library
Centralize all your digital assets in one organized repository. Upload, manage, organize, and search through all media files with ease.

**Key Capabilities:**
- Multi-format support
- Search and filtering
- Usage analytics
- Storage management
- File versioning

---

## 🔐 Security & Access Control

BlueVision implements enterprise-grade security measures:

- **Row-Level Security (RLS)**: Supabase RLS policies ensure users can only access their authorized data
- **Authentication**: Secure user authentication with session management
- **Authorization**: Role-based access control (RBAC) with granular permissions
- **Activity Logging**: Complete audit trail of all user actions
- **Environment Security**: Sensitive credentials managed via environment variables

---

## 🎨 UI/UX Components

Built with **shadcn/ui** and **Tailwind CSS** for a modern, accessible interface:

- Form components with validation
- Modal dialogs with rich interactions
- Responsive tables and data displays
- Toast notifications
- Theme-aware components
- Keyboard navigation support
- Mobile-responsive design

---

## 📊 State Management

**Zustand** for lightweight state management:
- Authentication state (`useAuthStore`)
- Notifications (`useNotificationStore`)
- Tour/onboarding state (`useTourStore`)

**React Query** for server state:
- Automatic caching and synchronization
- Background refetching
- Optimistic updates
- Error handling

---

## 🧪 Testing & Quality

- TypeScript for type safety
- Zod for runtime validation
- Component error boundaries
- Activity logging for debugging
- Real-time monitoring dashboards

---

## 📚 API Integration

### Xibo CMS Integration
BlueVision integrates seamlessly with Xibo CMS for professional digital signage management, providing:
- Authentication and session management
- Display and layout management
- Media handling and organization
- Schedule creation and management

### Supabase Edge Functions
Custom Edge Functions handle:
- Xibo API proxy requests
- Complex business logic
- Real-time updates
- Activity logging

---

## 🌟 Performance Optimizations

- **Vite**: Ultra-fast build tool with instant HMR
- **Code Splitting**: Automatic route-based chunking
- **Lazy Loading**: Component and route-level lazy loading
- **Query Optimization**: React Query caching strategies
- **Image Optimization**: Responsive image handling
- **CSS Optimization**: Tailwind CSS purging

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Drag-and-drop timeline scheduling
- [ ] Template library with pre-built layouts
- [ ] API documentation and webhooks
- [ ] Multi-tenancy support
- [ ] Advanced user roles and permissions
- [ ] Content preview player
- [ ] Batch operations and bulk import
- [ ] Integration with third-party services

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Support & Contact

For questions, issues, or suggestions:
- 📧 Email: support@bluevision.io
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/BlueVision/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/BlueVision/discussions)

---

## 🙏 Acknowledgments

- **React Team** for the incredible JavaScript framework
- **Supabase** for the real-time backend-as-a-service
- **Tailwind CSS** for utility-first CSS framework
- **shadcn/ui** for beautiful, accessible components
- **Vite** for the next-generation build tool
- **Xibo Project** for professional digital signage CMS

---

<div align="center">

### ⭐ Found this helpful? Give it a star!

Made with ❤️ for the digital signage community

**[⬆ Back to Top](#-bluevision)**

</div>
