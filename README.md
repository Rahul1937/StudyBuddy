# StudyBuddy

A full-stack Next.js study time tracking application with an AI assistant and comprehensive analytics.

## Features

- 🔐 **Authentication**: NextAuth with Email/Password and Google OAuth
- ⏱️ **Study Timer**: Track study sessions with categories (revision, self-study, class, others)
- 🤖 **AI Assistant**: Free AI chat powered by Groq API (Llama 3) with task/note creation
- 📊 **Analytics Dashboard**: Daily, weekly, and monthly stats with Recharts
- ✅ **Tasks Management**: Create and manage study tasks
- 📝 **Notes**: Save and organize study notes
- 🎯 **Category Breakdown**: Visualize study time by category

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Prisma ORM with PostgreSQL (Vercel Postgres/Supabase)
- **Authentication**: NextAuth.js
- **AI**: Groq API (Llama 3)
- **Charts**: Recharts
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (Vercel Postgres, Supabase, or local)
- Groq API key (free at https://console.groq.com)
- Google OAuth credentials (optional, for Google sign-in)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd studybuddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Groq API
   GROQ_API_KEY="your-groq-api-key"
   ```

4. **Generate NextAuth secret**
   ```bash
   openssl rand -base64 32
   ```

5. **Set up the database**
   ```bash
   # Push Prisma schema to database
   npx prisma db push
   
   # Generate Prisma Client
   npx prisma generate
   ```

6. **You're all set!**
   
   The application is ready to use.

## Running the Application

1. **Development mode**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Create an account**
   - Register a new account or sign in with Google
   - Start tracking your study time!

## Project Structure

```
studybuddy/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/         # Analytics dashboard
│   │   ├── study/             # Study timer page
│   │   ├── tasks/             # Tasks management
│   │   ├── notes/             # Notes management
│   │   └── layout.tsx          # Dashboard layout with sidebar
│   ├── api/                   # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── timer/             # Timer endpoints
│   │   ├── ai/                # AI chat endpoint
│   │   ├── tasks/             # Tasks CRUD
│   │   ├── notes/             # Notes CRUD
│   │   └── stats/              # Statistics endpoint
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── layout.tsx             # Root layout
│   ├── providers.tsx          # Context providers
│   └── globals.css            # Global styles
├── components/
│   ├── Sidebar.tsx            # Navigation sidebar
│   ├── Header.tsx             # App header
│   └── ChatWidget.tsx         # Floating chat widget
├── contexts/
│   ├── TimerContext.tsx       # Timer state management
│   └── AIChatContext.tsx      # AI chat state management
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── auth.ts                # NextAuth configuration
│   ├── groq.ts                # Groq API client
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                    # Static assets
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Timer
- `POST /api/timer/start` - Start timer (validation)
- `POST /api/timer/stop` - Stop timer and save session

### AI Chat
- `POST /api/ai/chat` - Send message to AI, auto-create tasks/notes

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `PATCH /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### Statistics
- `GET /api/stats?type=daily|weekly|monthly` - Get study statistics

## Database Schema

### User
- id, name, email, emailVerified, image, password
- Relations: accounts, sessions, studySessions, tasks, notes

### StudySession
- id, userId, category, startTime, endTime, duration (seconds)

### Task
- id, userId, title, status (pending/completed)

### Note
- id, userId, content

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard

3. **Set up Vercel Postgres**
   - In Vercel dashboard, go to Storage
   - Create a new Postgres database
   - Copy the connection string to `DATABASE_URL`

4. **Deploy**
   - Vercel will automatically deploy on push
   - Run migrations: `npx prisma db push` in Vercel CLI or use Vercel's database tab

## Getting API Keys

### Groq API (Free)
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create an API key
4. Add to `GROQ_API_KEY` in `.env`

### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

## Features in Detail

### Study Timer
- Select a category before starting
- Real-time elapsed time display
- Automatic session saving on stop
- Pause and resume functionality

### AI Assistant
- Natural language chat interface
- Automatic task creation: Say "I need to do X" or "Task: Y"
- Automatic note creation: Say "Note: X" or "Remember: Y"
- Powered by Groq's free Llama 3 model

### Dashboard Analytics
- Daily, weekly, monthly time tracking
- Category breakdown (pie chart)
- Time series graph (line chart)
- Category comparison (bar chart)


## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Run `npx prisma db push` to sync schema

### Authentication Not Working
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- For Google OAuth, verify redirect URIs

### AI Chat Not Responding
- Verify `GROQ_API_KEY` is set correctly
- Check Groq API quota/limits
- Review browser console for errors


## Development

### Database Management
```bash
# View database in Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push

# Generate Prisma Client
npx prisma generate
```

### Building for Production
```bash
npm run build
npm start
```

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Next.js, Prisma, and NextAuth documentation
- Check Groq API documentation for AI-related issues

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
