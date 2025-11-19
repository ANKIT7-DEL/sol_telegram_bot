# sol_telegram_bot

A Telegram bot for managing Solana wallets - generate wallets, check balances, and send SOL transactions directly through Telegram

## Features

- 🔑 Generate Solana wallets
- 💰 Check wallet balance
- 📤 Send SOL to other addresses
- 🔐 Secure wallet management

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure Bot Token

Get your bot token from [@BotFather](https://t.me/botfather) on Telegram:
1. Send `/newbot` to create a new bot
2. Follow the prompts to get your bot token
3. Copy the token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

Set the token as an environment variable:

**Option A: Using command line (temporary)**
```bash
$env:BOT_TOKEN="YOUR_BOT_TOKEN_HERE"; bun run index.ts
```

**Option B: Using .env file (recommended)**

Create a `.env` file in the project root:
```
BOT_TOKEN=your_actual_bot_token_here
```

Then run with:
```bash
bun --env-file=.env run index.ts
```

## Running the Bot

```bash
bun run index.ts
```

Or with .env file:
```bash
bun --env-file=.env run index.ts
```

## Usage

1. Start a chat with your bot on Telegram
2. Send `/start` to begin
3. Click "🔑 Generate Wallet" to create a new Solana wallet
4. Use "Show public key" to view your wallet address
5. Use "Send SOL" to transfer SOL to another address

## Tech Stack

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Telegraf](https://telegraf.js.org/) - Telegram Bot framework
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana JavaScript SDK

## Important Notes

⚠️ **Security Warning**: This bot stores private keys in memory. Do not use for production or store significant amounts of SOL.

⚠️ **Network**: Currently configured to use Solana mainnet-beta. Consider using devnet for testing.
