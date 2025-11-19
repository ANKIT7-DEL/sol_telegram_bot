import { Telegraf, Markup } from 'telegraf';
import { message } from "telegraf/filters";
import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const bot = new Telegraf(process.env.BOT_TOKEN || "");
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

const USERS: Record<string, Keypair> = {}
interface PendingRequestType {
    type: "SEND_SOL" | "SEND_TOKEN",
    amount?: number,
    to?: string
}
const PENDING_REQUESTS: Record<string, PendingRequestType> = {};

const keyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('🔑 Generate Wallet', 'generate_wallet'),
        Markup.button.callback('Show public key', 'show_public_key'),
    ],
])

const onlyGenerateBoard = Markup.inlineKeyboard([
    [
        Markup.button.callback('🔑 Generate Wallet', 'generate_wallet'),
    ],
])

const postWalletCreationKeyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('Send SOL', 'send_sol'),
        Markup.button.callback('Show public key', 'show_public_key'),
    ],
])

bot.start(async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    
    let welcomeMessage = `Hi there`;

    return ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

bot.action("generate_wallet", (ctx) => {
    ctx.answerCbQuery('Generating new wallet...');
    const keypair = Keypair.generate()
    const userId = ctx.from?.id;
    USERS[userId] = keypair;

    ctx.sendMessage(`New wallet created for you with public key ${keypair.publicKey.toBase58()}`, {
        parse_mode: 'Markdown',
        ...postWalletCreationKeyboard
    })
})

bot.action("show_public_key", (ctx) => {
    ctx.answerCbQuery('Getting your public key...');
    const userId = ctx.from?.id;
    const keypair = USERS[userId];

    if (!keypair) {
        ctx.sendMessage(`You dont have a wallet with us yet, please click generate wallet to create one`, {
            parse_mode: 'Markdown',
            ...onlyGenerateBoard
        })
        return;
    }

    ctx.sendMessage(`This is your public key ${keypair.publicKey.toBase58()}`, {
        parse_mode: 'Markdown',
        ...postWalletCreationKeyboard
    })
})

bot.action("send_sol", (ctx) => {
    const userId = ctx.from?.id;
    ctx.answerCbQuery()
    ctx.sendMessage("Can u share the address to send to")
    PENDING_REQUESTS[userId] = {
        type: "SEND_SOL"
    }
});

bot.on(message("text"), async (ctx) => {
    const userId = ctx.from?.id;
    if (PENDING_REQUESTS[userId]?.type == "SEND_SOL") {
        if (PENDING_REQUESTS[userId] && !PENDING_REQUESTS[userId].to) {
            // TODO: Check here if it is a valid public key
            PENDING_REQUESTS[userId].to = ctx.message.text;
            ctx.sendMessage("How much SOL do you want to send");
        } else {
            const amount = ctx.message.text;
            
            // Check if this is a valid amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                ctx.sendMessage("Invalid amount. Please enter a positive number.", {
                    parse_mode: 'Markdown',
                    ...postWalletCreationKeyboard
                });
                delete PENDING_REQUESTS[userId];
                return;
            }

            // Check if user has this much SOL in their wallet
            const userKeypair = USERS[userId];
            if (!userKeypair) {
                ctx.sendMessage("You don't have a wallet. Please generate one first.", {
                    parse_mode: 'Markdown',
                    ...onlyGenerateBoard
                });
                delete PENDING_REQUESTS[userId];
                return;
            }

            try {
                const balance = await connection.getBalance(userKeypair.publicKey);
                const balanceInSol = balance / LAMPORTS_PER_SOL;
                const amountInLamports = parsedAmount * LAMPORTS_PER_SOL;

                if (balance < amountInLamports) {
                    ctx.sendMessage(`Insufficient balance. You have ${balanceInSol.toFixed(4)} SOL but trying to send ${parsedAmount} SOL.`, {
                        parse_mode: 'Markdown',
                        ...postWalletCreationKeyboard
                    });
                    delete PENDING_REQUESTS[userId];
                    return;
                }

                // Create a txn and forward it to the blockchain
                const toPublicKey = new PublicKey(PENDING_REQUESTS[userId].to!);
                const transaction = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: userKeypair.publicKey,
                        toPubkey: toPublicKey,
                        lamports: amountInLamports,
                    })
                );

                const signature = await sendAndConfirmTransaction(
                    connection,
                    transaction,
                    [userKeypair]
                );

                ctx.sendMessage(`✅ Transaction successful!\n${parsedAmount} SOL sent to ${PENDING_REQUESTS[userId].to}\n\nSignature: ${signature}`, {
                    parse_mode: 'Markdown',
                    ...postWalletCreationKeyboard
                });
            } catch (error) {
                console.error('Transaction error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                ctx.sendMessage(`❌ Transaction failed: ${errorMessage}`, {
                    parse_mode: 'Markdown',
                    ...postWalletCreationKeyboard
                });
            }
            
            delete PENDING_REQUESTS[userId];
        }
    }

})

await bot.launch()