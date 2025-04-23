const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

const token = '7729532380:AAHQgIrbq7r6T23hhVU0zuE8UmsiEls6x-E';

const bot = new TelegramBot(token, { polling: true });

function logActivity(msg) {
  const user = msg.from;
  const chat = msg.chat;
  const command = msg.text.toLowerCase();

  console.log(`Telegram Bot Usage Activity`);
  console.log(`• User ID: ${user.id}`);
  console.log(`• Username: ${user.username || 'None'}`);
  console.log(`• Chat ID: ${chat.id}`);
  console.log(`• Command: ${command}`);
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const command = msg.text.toLowerCase();

  logActivity(msg);

  if (command === '/start') {
    const now = new Date().toLocaleString();
    const welcomeMsg = `
Welcome to the Bot!
Date & Time: ${now}

Menu:
- /mix [url] [time] [thread] [rate]
- /show
- /help
    `;
    bot.sendMessage(chatId, welcomeMsg);

  } else if (command === '/help') {
    const helpMessage = `
Available Commands:
/mix [url] [time] [thread] [rate] - Start mix.js with given parameters.
/show - Show author and current real-time info.
/help - Show this help message.
/start - Start bot, show menu and time.
    `;
    bot.sendMessage(chatId, helpMessage);

  } else if (command === '/show') {
    const author = "Made by @Ricozhen";
    const now = new Date().toLocaleString();
    bot.sendMessage(chatId, `${author}\nReal-Time: ${now}`);

  } else if (command.startsWith('/mix')) {
    const args = command.split(' ');
    const url = args[1];
    const time = args[2];
    const thread = args[3];
    const rate = args[4];

    if (args.length === 5 && url && time && thread && rate) {
      exec(`node mix.js ${url} ${time} ${thread} ${rate}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          bot.sendMessage(chatId, 'Successful');
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          bot.sendMessage(chatId, 'Successful');
          return;
        }
        console.log(`stdout: ${stdout}`);
        bot.sendMessage(chatId, 'Process has started.');
      });
    } else {
      bot.sendMessage(chatId, 'Incorrect message format. Use: /mix [url] [time] [thread] [rate]');
    }
  }
});
