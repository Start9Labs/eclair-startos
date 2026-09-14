import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  /** JVM maximum heap, in MiB. Passed as -Xmx; it has no eclair.conf equivalent. */
  maxHeapMib: z.number().int().catch(1024),
  /**
   * The port eclair listens on and announces, settled by `setInterfaces`. Kept
   * so the choice is stable across restarts: recomputing it would draw a new
   * port on every start of a server where the standard one is taken, churning
   * the node's announced address. It is verified against the binding on every
   * pass rather than trusted, so a restore onto a server where it is held
   * settles again. `null` until the first pass.
   */
  peerPort: z.number().int().nullable().catch(null),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'startos-store.json' },
  shape,
)
