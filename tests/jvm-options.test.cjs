const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

async function eclairExec(maxHeapMib) {
  let exec
  const chain = {
    addOneshot: () => chain,
    addDaemon: (_id, daemon) => {
      exec = daemon.exec
      return chain
    },
    addHealthCheck: () => chain,
  }
  const sdk = {
    setupMain: (fn) => fn,
    volumes: { main: { subpath: (path) => `/data/${path}` } },
    SubContainer: { of: () => ({ rootfs: '/container' }) },
    Daemons: { of: () => chain },
  }
  const noop = async () => {}
  const modules = {
    'node:crypto': require('node:crypto'),
    'node:path': require('node:path'),
    'node:fs/promises': {
      mkdir: noop,
      rename: noop,
      rm: noop,
      writeFile: noop,
    },
    '@start9labs/start-sdk': {
      FileHelper: { string: () => ({ read: () => ({ const: noop }) }) },
    },
    './fileModels/eclair.conf': {
      eclairConf: {
        merge: noop,
        read: () => ({ const: async () => ({ 'api.password': 'test' }) }),
      },
    },
    './fileModels/store.json': {
      storeJson: {
        read: (select) => ({ const: async () => select({ maxHeapMib }) }),
      },
    },
    './fileModels/vpn.conf': {},
    './i18n': { i18n: (s) => s },
    './sdk': { sdk },
    './utils': {
      apiPasswordFile: '/public/api/password',
      dataDir: '/data',
      getBitcoindBundle: async () => ({}),
      peerPublicAddresses: async () => [],
      mainMounts: { mountDependency: () => ({}) },
    },
    './vpn': {},
  }
  const exports = {}
  runInNewContext(
    ts.transpileModule(readFileSync('startos/main.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      console,
      require: (name) => {
        assert.ok(name in modules, `Unexpected import: ${name}`)
        return modules[name]
      },
    },
  )
  await exports.main({ effects: {} })
  return exec
}

for (const arch of ['amd64', 'arm64']) {
  for (const configuredHeap of [undefined, 4096]) {
    const heapMiB = configuredHeap ?? 1024
    test(`Eclair launcher preserves ${heapMiB} MiB heap and logging on ${arch}`, async () => {
      const exec = await eclairExec(configuredHeap)
      const result = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--platform',
          `linux/${arch}`,
          '--network',
          'none',
          '-e',
          `JAVA_OPTS=${exec.env.JAVA_OPTS} -XX:+PrintFlagsFinal -XshowSettings:properties --dry-run`,
          process.env[`ECLAIR_JVM_IMAGE_${arch.toUpperCase()}`] ||
            `helix/eclair-jvm-security:${arch}`,
          ...exec.command,
        ],
        { encoding: 'utf8', timeout: 30000 },
      )
      assert.ifError(result.error)
      const output = result.stdout + result.stderr
      assert.equal(result.status, 0, output)
      assert.match(
        output,
        /UseBASE64Intrinsics\s+= false\s+\{product\} \{command line\}/,
      )
      assert.match(
        output,
        new RegExp(`MaxHeapSize\\s+= ${heapMiB * 1024 ** 2}\\s`),
      )
      assert.match(output, /eclair.printToConsole = true/)
      assert.match(output, /eclair.datadir = \/data/)
      console.info(
        output
          .split('\n')
          .filter((line) =>
            /UseBASE64Intrinsics\s+=|java.runtime.version =/.test(line),
          )
          .join('\n'),
      )
    })
  }
}
