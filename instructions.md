# Eclair

Install Bitcoin first and let it finish syncing before you start Eclair. Eclair refuses to run against a node that is still catching up, and it needs that node kept unpruned with the transaction index on — a setting you cannot change later without resyncing the whole chain.

## Documentation

- [Eclair documentation](https://github.com/ACINQ/eclair/tree/master/docs) — the upstream guides: configuration, usage, Tor, monitoring and the release notes.
- [Eclair API reference](https://acinq.github.io/eclair) — every API call, with examples.

## What you get on StartOS

A full Lightning routing node. Eclair opens payment channels, forwards other people's payments and earns fees on them, and lets you send and receive Lightning payments yourself.

Eclair has no screen of its own. Everything you do with it goes through its **API** interface, either from a client that speaks it or from the `eclair-cli` command line tool. The **Peer** interface is how other Lightning nodes reach you to open channels.

Your on-chain money lives in your Bitcoin service, not here. Eclair opens channels by spending from a wallet called `eclair` that it creates inside Bitcoin, and channels you close pay back into that same wallet. Back up Bitcoin as well as Eclair, or you will restore your channels without the coins behind them.

## Getting set up

1. Install Bitcoin and wait for it to finish syncing. This takes days on a fresh node.
2. Bitcoin will show a task asking you to change three settings — ZeroMQ, the transaction index and pruning. Approve it. Eclair cannot run otherwise.
3. Open Eclair and run the **Set API Password** task. The password appears once, so copy it somewhere safe before closing the dialog. Eclair will not start until you have done this.
4. Start Eclair. It will sit at "starting" for a minute or two while it loads, and longer if Bitcoin is still catching up.
5. Add an address to the **Peer** interface — a Tor address is the simplest. Until you do, you can open channels with other people but nobody can open one with you, and Eclair will say so under **Node Reachability**.
6. Run **Node Info** to get your node's URI — the address another node needs in order to open a channel with you.
7. Send some bitcoin to your Bitcoin service. You cannot open a channel until there are coins in the `eclair` wallet to fund it with.

## Using Eclair

### The API

Connect to the **API** interface with an **empty username** and your API password. Every dashboard, wallet and script that supports Eclair uses this.

From a terminal, `eclair-cli` is bundled in the service:

```
start-cli package attach eclair -n eclair-sub -- eclair-cli -p <your-password> getinfo
```

The same interface carries a WebSocket at `/ws` that pushes an event whenever you receive a payment.

### Actions

- **Set API Password** — generates your API password, and generates a new one whenever you want to cut off everything currently connected. Restart Eclair afterwards for the change to take effect.
- **Node Info** — your node's public key, alias, block height and the URIs peers can reach you at.
- **General Settings** — your node's name and color, whether new channels are announced to the network, and trampoline relaying. An unannounced node can still send and receive; it just won't be routed through by strangers.
- **Routing Fees** — what you charge to forward other people's payments.
- **On-Chain Fees** — how quickly you want channel openings and closings to confirm. **Maximum Funding Feerate** protects channel opens and splices from inaccurate fee estimates; raise it or use RBF when one stalls. If a channel close is stuck unconfirmed, raise **Maximum Closing Feerate** and restart; Eclair will re-bid the transaction at the higher rate.
- **Channel Settings** — the smallest and largest channels you will accept, and what to do about coins left locked by a channel opening that was interrupted. If Eclair refuses to start and complains about locked coins, set that to **Unlock** and restart.
- **Performance** — how much memory Eclair may use. Raise it if Eclair stops with an out-of-memory error; a node with many channels needs more than the default.

Settings changes are written to Eclair's configuration file, which it only reads when it starts, so restart Eclair after changing any of them.

### Backups

A backup of Eclair captures your node identity, your channels and your payment history. It does not capture your on-chain coins — those are in Bitcoin's wallet, so back up Bitcoin too. After restoring, Eclair rebuilds its map of the network from your peers, and payments will fail to route until it has.

## Limitations

Eclair runs on mainnet only, and the checks it normally makes against outside block explorers are turned off so that nothing about your node leaves your server.
