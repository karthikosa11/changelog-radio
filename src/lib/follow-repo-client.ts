import { getAuthToken } from 'deepspace'

/** Calls the followRepo server action. Resolves to an error message, or null on success. */
export async function followRepo(repo: string): Promise<string | null> {
  const token = await getAuthToken()
  if (!token) return 'You are signed out. Sign in and try again.'

  const res = await fetch('/api/actions/followRepo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ repo }),
  })
  const body = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
  if (res.ok && body?.success) return null
  return body?.error ?? `Follow failed (${res.status}).`
}
