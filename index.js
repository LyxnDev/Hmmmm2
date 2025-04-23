const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const https = require('https');

const token = '7729532380:AAHQgIrbq7r6T23hhVU0zuE8UmsiEls6x-E';
const bot = new TelegramBot(token, { polling: true });

// Utils
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

const logActivity = (msg) => {
  const user = msg.from;
  const chat = msg.chat;
  const command = msg.text.toLowerCase();

  console.log(`Bot Usage Activity:`);
  console.log(`- User ID: ${user.id}`);
  console.log(`- Username: ${user.username || 'None'}`);
  console.log(`- Chat ID: ${chat.id}`);
  console.log(`- Command: ${command}`);
};

// Command Handlers
const handleStart = (chatId) => {
  const message = `
Welcome to the Telegram Bot!

Date & Time: ${getManilaTime()}

Main Commands:
/mix [url] [time] [thread] [rate] - Run the mix script
/show - Show author info and real-time
/ip - Show public IP address
/uid - Show your Telegram ID and username
/help - Show all commands
  `;
  bot.sendMessage(chatId, message);
};

const handleHelp = (chatId) => {
  const message = `
Available Commands:
/start - Start the bot and show menu
/help - Show this help message
/show - Show author and current time (Asia/Manila)
/ip - Show public IP address
/uid - Show your Telegram ID and username
/mix [url] [time] [thread] [rate] - Run mix.js with arguments
  `;
  bot.sendMessage(chatId, message);
};

const handleShow = (chatId) => {
  const author = "Created by @yourusername";
  const time = getManilaTime();
  bot.sendMessage(chatId, `${author}\nCurrent Time (Asia/Manila): ${time}`);
};

const handleIP = (chatId) => {
  getPublicIP((ip) => {
    bot.sendMessage(chatId, `Public IP Address: ${ip}`);
  });
};

const handleUID = (chatId, user) => {
  bot.sendMessage(
    chatId,
    `Your Telegram ID: ${user.id}\nUsername: ${user.username || 'None'}`
  );
};

const handleMix = (chatId, args) => {
  const [url, time, thread, rate] = args;

  if (args.length !== 4 || !url || !time || !thread || !rate) {
    return bot.sendMessage(
      chatId,
      `Invalid format. Use:\n/mix [url] [time] [thread] [rate]`
    );
  }

  const command = `node mix.js ${url} ${time} ${thread} ${rate}`;
  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(error || stderr);
      bot.sendMessage(chatId, 'Failed to start process.');
    } else {
      console.log(stdout);
      bot.sendMessage(chatId, 'Process started successfully.');
    }
  });
};

// Main Listener
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim().toLowerCase();
  const user = msg.from;

  if (!text) return;

  logActivity(msg);

  if (text === '/start') return handleStart(chatId);
  if (text === '/help') return handleHelp(chatId);
  if (text === '/show') return handleShow(chatId);
  if (text === '/ip') return handleIP(chatId);
  if (text === '/uid') return handleUID(chatId, user);
  if (text.startsWith('/mix')) {
    const args = msg.text.trim().split(' ').slice(1);
    return handleMix(chatId, args);
  }

  bot.sendMessage(chatId, 'Unknown command. Type /help to see available commands.');
});
