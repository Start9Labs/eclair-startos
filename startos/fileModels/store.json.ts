import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  /** JVM maximum heap, in MiB. Passed as -Xmx; it has no eclair.conf equivalent. */
  maxHeapMib: z.number().int().catch(1024),
  /**
   * The port eclair listens on and announces, settled by `setInterfaces` and
   * tried first on every later pass. Without it a pass with a Tor address on
   * the interface would start over from 9735 and leave eclair listening where
   * the onion does not forward. Verified against the binding rather than
   * trusted, so a restore onto a server where it is held settles again. `null`
   * until the first pass.
   */
  peerPort: z.number().int().nullable().catch(null),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'startos-store.json' },
  shape,
)
