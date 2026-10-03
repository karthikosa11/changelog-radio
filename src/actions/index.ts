import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { followRepo } from './follow-repo'

export const actions: Record<string, ActionHandler<Env>> = {
  followRepo,
}
