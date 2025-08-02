# Quickdesk Helpdesk System

A modern, full-featured helpdesk system built with Next.js 15, Supabase, and TypeScript. This system provides a comprehensive solution for managing customer support tickets with role-based access control.

## 🚀 Features

### ✅ Implemented Features

#### User Management
- **User Registration & Login**: Secure authentication system with role-based access
- **Role-based Access Control**: Three user roles (User, Agent, Admin) with different permissions
- **User Dashboard**: Personalized dashboard showing ticket statistics and recent activity

#### Ticket Management
- **Create Tickets**: Users can create support tickets with:
  - Subject and detailed description
  - Category selection from predefined categories
  - Priority levels (Low, Medium, High, Urgent)
  - File attachment support (UI ready, backend pending)
- **Ticket Status Tracking**: Complete lifecycle management
  - Open → In Progress → Resolved → Closed
- **Ticket Assignment**: Agents can be assigned to specific tickets
- **Comments System**: Users and agents can add comments to tickets
  - Internal comments for agent-to-agent communication
  - Public comments visible to ticket creators

#### Search & Filtering
- **Advanced Search**: Search tickets by subject or description
- **Multiple Filters**:
  - Filter by status (Open, In Progress, Resolved, Closed)
  - Filter by category
  - Filter by priority level
- **Sorting Options**:
  - Sort by creation date, update date, subject, status, or priority
  - Ascending/descending order
- **URL-based Filters**: Shareable filtered views with URL parameters

#### Agent Features
- **Ticket Management Interface**: Dedicated interface for agents to manage all tickets
- **Ticket Assignment**: Assign tickets to themselves or other agents
- **Status Updates**: Change ticket status through the workflow
- **Internal Communication**: Add internal comments not visible to users

#### Admin Features
- **Admin Dashboard**: Overview of system statistics and management tools
- **User Management**: Create, edit, and manage user accounts and roles
- **System Overview**: Monitor ticket statistics and system health

#### Dashboard & Analytics
- **Personal Statistics**: Users see their own ticket counts by status
- **System Statistics**: Agents and admins see overall system metrics
- **Recent Activity**: Quick access to recent tickets and assignments

### 🚧 Planned Features (Not Yet Implemented)
- Admin interface for category management
- User voting system (upvote/downvote tickets)
- Email notifications for ticket updates
- File attachment upload functionality
- Advanced reporting and analytics

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication with Supabase
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React

## 📋 Prerequisites

Before setting up the project locally, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account and project

## 🚀 Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ShivamHirwani/quick-desk.git
cd quick-desk
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project in [Supabase](https://supabase.com)
2. Go to Settings → API to get your project credentials
3. Copy the following values:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for admin operations)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URLs (automatically provided by Supabase)
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
```

### 5. Set Up the Database

The project includes SQL scripts to set up the database schema and seed data:

1. **Create Tables**: Run `scripts/01-create-tables.sql` in your Supabase SQL editor
2. **Seed Data**: Run `scripts/02-seed-data.sql` to add default categories and admin user
3. **User Management**: Run `scripts/03-add-user-management.sql` for additional user features

Or use the Supabase CLI:

```bash
# If you have Supabase CLI installed
supabase db reset
```

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Default Login Credentials

After running the seed script, you can log in with:

**Admin Account:**
- Email: admin@quickdesk.com
- Password: admin123

**Agent Account:**
- Email: agent@quickdesk.com
- Password: agent123

## 📱 Usage Guide

### For End Users
1. **Register**: Create a new account or log in
2. **Create Tickets**: Click "Create Ticket" to submit support requests
3. **Track Progress**: View your tickets and their current status
4. **Search & Filter**: Use the search and filter options to find specific tickets
5. **Add Comments**: Communicate with support agents through ticket comments

### For Support Agents
1. **Access Management**: Use "Manage Tickets" to see all system tickets
2. **Assign Tickets**: Assign tickets to yourself or other agents
3. **Update Status**: Move tickets through the workflow (Open → In Progress → Resolved → Closed)
4. **Internal Notes**: Add internal comments for team communication

### For Administrators
1. **Admin Panel**: Access the admin dashboard for system overview
2. **User Management**: Create and manage user accounts and roles
3. **System Monitoring**: Monitor ticket statistics and system health

## 🗂️ Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin-only pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── tickets/           # Ticket-related pages
│   └── ...
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                  # Utility functions and configurations
├── scripts/              # Database setup scripts
└── public/               # Static assets
```

## 🔐 Security Features

- **Role-based Access Control**: Different permissions for users, agents, and admins
- **Secure Authentication**: Password hashing and secure session management
- **Data Validation**: Input validation on both client and server side
- **SQL Injection Protection**: Parameterized queries through Supabase
- **CORS Protection**: Proper CORS configuration for API endpoints

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
