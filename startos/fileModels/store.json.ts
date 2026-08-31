import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  /** JVM maximum heap, in MiB. Passed as -Xmx; it has no eclair.conf equivalent. */
  maxHeapMib: z.number().int().catch(1024),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'startos-store.json' },
  shape,
)
