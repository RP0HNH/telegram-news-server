const TelegramBot = require('node-telegram-bot-api');
const { saveMediaFile, savePost } = require('./utils/fileUtils');
const uuid = require('uuid');

// Токен Telegram-бота
const TOKEN = '7422383739:AAHi7BxDS6wREfH8r6UnUUHQ100ofaORtN8';

// Инициализация Telegram-бота
const bot = new TelegramBot(TOKEN, { polling: true });

const setupBot = () => {
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        let text = msg.text || msg.caption || '';

        const post = {
            id: msg.message_id,
            chat_id: chatId,
            text: text.trim(),
            date: new Date(msg.date * 1000).toISOString(),
            media: [],
        };

        try {
            // Обрабатываем медиа-файлы
            if (msg.photo) {
                const largestPhoto = msg.photo[msg.photo.length - 1];
                const file = await bot.getFile(largestPhoto.file_id);
                const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
                const filePath = await saveMediaFile(fileUrl, `${uuid.v4()}.jpg`);
                post.media.push({ type: 'photo', file_id: largestPhoto.file_id, path: filePath });
            }

            if (msg.video) {
                const file = await bot.getFile(msg.video.file_id);
                const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
                const filePath = await saveMediaFile(fileUrl, `${uuid.v4()}.mp4`);
                post.media.push({ type: 'video', file_id: msg.video.file_id, path: filePath });
            }

            if (msg.document) {
                const file = await bot.getFile(msg.document.file_id);
                const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
                const filePath = await saveMediaFile(fileUrl, `${uuid.v4()}_${msg.document.file_name || msg.document.file_id}`);
                post.media.push({ type: 'document', file_id: msg.document.file_id, path: filePath });
            }

            savePost(post);
            bot.sendMessage(chatId, 'Сообщение успешно сохранено!');
        } catch (error) {
            console.error('Ошибка при обработке медиа:', error.message);
            bot.sendMessage(chatId, 'Произошла ошибка при сохранении сообщения.');
        }
    });
};

module.exports = { setupBot };
