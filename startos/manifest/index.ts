import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'eclair',
  title: 'Eclair',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/Start9Labs/eclair-startos',
  upstreamRepo: 'https://github.com/ACINQ/eclair',
  marketingUrl: 'https://acinq.co',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  virtualNetworking: true,
  images: {
    eclair: {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
