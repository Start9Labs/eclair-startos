import { sdk } from '../sdk'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { watchCredentials } from './watchCredentials'
import { watchHosts } from './watchHosts'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  actions,
  dependencies,
  watchHosts,
  watchCredentials,
)

export const uninit = sdk.setupUninit(versionGraph)
