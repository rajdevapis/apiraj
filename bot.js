const TelegramBot = require('node-telegram-bot-api');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, updateDoc, increment } = require('firebase/firestore');

// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyCka64ZqgG38oyzwgog5DQCJ2kDxhZUMcM",
    authDomain: "movie-ee8bb.firebaseapp.com",
    projectId: "movie-ee8bb",
    storageBucket: "movie-ee8bb.firebasestorage.app",
    messagingSenderId: "556029948819",
    appId: "1:556029948819:web:8c525a6958e93d633c2e66"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- TELEGRAM BOT SETUP ---
const BOT_TOKEN = '8994252241:AAHyWNJdsBazdC8K386HlkuXhOsf2pI4uog'; // Apna Bot Token yahan replace karein
const WEB_APP_URL = 'https://yourearn.ifree.page/'; // Example: https://your-site.com/index.html
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// User states track karne ke liye (Withdrawal ke time UPI ID lene ke liye)
const userStates = {};

// Main Keyboard Menu
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: "🎁 Daily Bonus" }, { text: "👥 Refer & Earn" }],
            [{ text: "💰 Balance" }, { text: "🏦 Withdraw" }],
            [{ text: "🌐 Open Web App", web_app: { url: WEB_APP_URL } }]
        ],
        resize_keyboard: true
    }
};

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const referrerId = match[1]; 
    const userRef = doc(db, 'users', chatId.toString());
    
    try {
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            // Naya user create karein
            await setDoc(userRef, {
                balance: 0,
                joinedAt: new Date().toISOString(),
                referredBy: referrerId || null,
                lastBonus: 0
            });

            // Referrer ko ₹5 bonus dena (agar kisi ki link se join kiya hai)
            if (referrerId && referrerId !== chatId.toString()) {
                const referrerRef = doc(db, 'users', referrerId);
                const referrerSnap = await getDoc(referrerRef);
                if (referrerSnap.exists()) {
                    await updateDoc(referrerRef, { balance: increment(5) });
                    bot.sendMessage(referrerId, "🎉 Aapke refer link se kisi ne join kiya! Aapke wallet mein ₹5 add kar diye gaye hain.");
                }
            }
        }
        bot.sendMessage(chatId, `Hello bhai, welcome to the Best Earning Bot! 🚀\nNeeche diye gaye buttons ka use karke earning start karein.`, mainKeyboard);
    } catch (error) {
        console.error("Start Error: ", error);
        bot.sendMessage(chatId, "Kuch error aa gayi bhai, thodi der mein try karein.");
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    const userRef = doc(db, 'users', chatId.toString());

    // --- WITHDRAWAL STATE HANDLING ---
    if (userStates[chatId] === 'AWAITING_UPI') {
        const upiId = text;
        userStates[chatId] = null; // State clear karein

        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const balance = userSnap.data().balance;
                if (balance >= 40) {
                    await updateDoc(userRef, { balance: increment(-40) });
                    
                    // Withdrawal request save karna
                    const withdrawRef = doc(db, 'withdrawals', Date.now().toString());
                    await setDoc(withdrawRef, {
                        userId: chatId,
                        upi: upiId,
                        amount: 40,
                        status: 'pending',
                        timestamp: new Date().toISOString()
                    });

                    bot.sendMessage(chatId, `✅ Withdrawal Successful!\n₹40 aapke UPI ID (${upiId}) par bhej diye jayenge.`, mainKeyboard);
                } else {
                    bot.sendMessage(chatId, `❌ Error: Aapka balance ₹${balance} hai. Withdrawal ke liye minimum ₹40 chahiye.`, mainKeyboard);
                }
            }
        } catch (error) {
            bot.sendMessage(chatId, "Transaction mein error aa gayi bhai.");
        }
        return;
    }

    // --- BUTTON ACTIONS ---
    if (text === "🎁 Daily Bonus") {
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                const now = Date.now();
                const lastBonus = data.lastBonus || 0;
                const hours12 = 12 * 60 * 60 * 1000;

                if (now - lastBonus >= hours12) {
                    await updateDoc(userRef, {
                        balance: increment(2),
                        lastBonus: now
                    });
                    bot.sendMessage(chatId, "🎉 Aapko ₹2 Daily Bonus mil gaya hai! Next bonus 12 hours baad milega.");
                } else {
                    const timeLeft = Math.ceil((hours12 - (now - lastBonus)) / (1000 * 60 * 60));
                    bot.sendMessage(chatId, `⏳ Bhai, aapne bonus le liya hai. Next bonus ${timeLeft} hours baad try karein.`);
                }
            }
        } catch (error) {
            bot.sendMessage(chatId, "Error fetching bonus.");
        }
    } 
    
    else if (text === "👥 Refer & Earn") {
        const botUsername = (await bot.getMe()).username;
        const referUrl = `https://t.me/${botUsername}?start=${chatId}`;
        bot.sendMessage(chatId, `🚀 Apne dosto ko invite karein aur har refer par ₹5 kamayein!\n\nAapka Refer Link:\n${referUrl}`);
    } 
    
    else if (text === "💰 Balance") {
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                bot.sendMessage(chatId, `💰 Aapka Total Balance: ₹${userSnap.data().balance}`);
            }
        } catch (error) {
            bot.sendMessage(chatId, "Balance check karne mein error hui.");
        }
    } 
    
    else if (text === "🏦 Withdraw") {
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().balance >= 40) {
                userStates[chatId] = 'AWAITING_UPI';
                bot.sendMessage(chatId, "🏦 Withdrawal process start...\nKripya apna **UPI ID** send karein:", { parse_mode: 'Markdown' });
            } else {
                bot.sendMessage(chatId, `❌ Error: Minimum withdrawal ₹40 hai. Aapka current balance ₹${userSnap.data().balance} hai.`);
            }
        } catch (error) {
            bot.sendMessage(chatId, "Error checking balance for withdrawal.");
        }
    }
});

console.log("Bot is running securely... 🚀");
