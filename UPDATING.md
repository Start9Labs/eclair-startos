# Updating the upstream version

Upstream is a **GitHub release archive**, not a Docker image. ACINQ publishes `acinq/eclair` on
Docker Hub, but that image is `x86_64` only and its last versioned tag is `release-0.8.0` from
2022 — only `latest` moves. Ignore it. The `Dockerfile` in this repository downloads the
`eclair-node-<version>-<commit>-bin.zip` asset from the GitHub release instead, verifies its
SHA-256, and unpacks it onto a Temurin JRE base. The archive is a JVM distribution carrying
natives for both architectures, so nothing is compiled and there is nothing arch-specific to bump.

## Determining the upstream version

The pin is three `ARG`s at the top of the `Dockerfile`: `ECLAIR_VERSION`, `ECLAIR_COMMIT` and
`ECLAIR_SHA256`. The release tag is `v<ECLAIR_VERSION>`, and the asset filename embeds a short
commit hash that changes with every release, so both must be read from the release itself:

```bash
gh release view -R ACINQ/eclair --json tagName,assets \
  -q '{tag: .tagName, asset: (.assets[] | select(.name | startswith("eclair-node-")) | .name)}'
```

The asset name is `eclair-node-<ECLAIR_VERSION>-<ECLAIR_COMMIT>-bin.zip`. The checksum comes from
the signed `SHA256SUMS.asc` on the same release:

```bash
gh release download -R ACINQ/eclair <tag> -p SHA256SUMS.asc -O - | grep eclair-node
```

## Applying the bump

1. Set the three `ARG`s in the `Dockerfile` to the values above.
2. Set `version` in `startos/versions/current.ts` to `<ECLAIR_VERSION>:0`, and write the release
   notes in all five locales.
3. **Read the upstream release notes for a new Bitcoin Core floor.** Eclair raises its minimum
   Bitcoin Core version fairly often — 0.14.0 required 30.x, 0.14.1 raised it to 31.x — and
   asserts it at startup, so a bump that misses one leaves the package unable to start against a
   Bitcoin node the dependency range still permits. Raise `versionRange` in
   `startos/dependencies.ts` to match, and check whether the release also changed what Eclair
   requires of Bitcoin's configuration (the task in that file asks for ZeroMQ, the transaction
   index and no pruning).
4. Check the release notes for channel-level breaking changes. Eclair has refused to start on
   channel types it dropped support for — 0.14.0 did this to non-anchor channels — which strands
   a user until they close those channels on the older version. Anything of that kind belongs in
   the release notes the user reads before updating.
5. Add a `CHANGELOG`-style entry only in `releaseNotes`; there is no separate changelog here.
