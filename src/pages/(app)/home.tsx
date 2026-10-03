/**
 * /home is where sign-in lands (see src/server/http-routes.ts). The app's
 * real home is the feed, so send people straight there.
 */
import { Navigate } from 'react-router-dom'

export default function HomePage() {
  return <Navigate to="/feed" replace />
}
