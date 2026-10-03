/**
 * Typed access to app records from job code. buildCronContext is the SDK's
 * server-side, RBAC-bypassing records client; despite the name it only needs
 * the RECORD_ROOMS binding, so it works in jobs too.
 */
import { buildCronContext } from 'deepspace/worker'
import type { Env } from '../../worker'
import type { StoredRecord } from './scan-plan'

export function appRecords(env: Env) {
  // The room id must be the app scope; buildCronContext defaults to "default".
  const { records } = buildCronContext(env, env.OWNER_USER_ID, `app:${env.DEEPSPACE_APP_ID}`)
  return {
    query: <T>(collection: string, where?: Record<string, unknown>) =>
      records.query(collection, where ? { where } : undefined) as Promise<StoredRecord<T>[]>,
    create: (collection: string, data: Record<string, unknown>) =>
      records.create(collection, data) as Promise<{ recordId: string }>,
    update: (collection: string, id: string, data: Record<string, unknown>) =>
      records.update(collection, id, data),
  }
}

export type AppRecords = ReturnType<typeof appRecords>
