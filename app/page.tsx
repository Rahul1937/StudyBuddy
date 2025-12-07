import { redirect } from 'next/navigation'

export default function HomePage() {
  // Middleware will handle the redirect based on session
  // Default to login if no session
  redirect('/login')
}

