const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const path = require('path');
const uuid = require('uuid'); // Для генерации уникальных идентификаторов

const app = express();
app.use(bodyParser.json());

// Токен Telegram бота
const TOKEN = '7422383739:AAHi7BxDS6wREfH8r6UnUUHQ100ofaORtN8';

// Инициализация бота
const bot = new TelegramBot(TOKEN, { polling: true });

// Путь к файлу для хранения JSON
const DATA_FILE = './posts.json';
// Папка для хранения медиа-файлов
const MEDIA_DIR = './media';

// Создаем папку, если она не существует
if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Функция для сохранения медиа-файла локально
const saveMediaFile = (url, filename) => {
    const filePath = path.join(MEDIA_DIR, filename);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(filePath));
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => reject(err));
        });
    });
};

// Функция для сохранения данных в JSON
const savePost = (post) => {
    try {
        let data = [];
        if (fs.existsSync(DATA_FILE)) {
            data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        data.push(post);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Ошибка при записи файла:', error.message);
    }
};

// Обработка сообщений от пользователей в Telegram
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    let text = msg.text || msg.caption || '';

    const post = {
        id: msg.message_id,
        chat_id: chatId,
        text: text.trim(),
        date: new Date(msg.date * 1000).toISOString(),
        media: []
    };

    try {
        // Обрабатываем медиа (фото, видео, документы)
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

// Эндпоинт для получения списка постов в формате JSON
app.get('/posts', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        res.json(data);
    } else {
        res.json([]);
    }
});

// Эндпоинт для очистки файла с постами
app.delete('/posts', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        fs.unlinkSync(DATA_FILE);
    }
    if (fs.existsSync(MEDIA_DIR)) {
        fs.rmSync(MEDIA_DIR, { recursive: true, force: true });
        fs.mkdirSync(MEDIA_DIR);
    }
    res.json({ message: 'Данные очищены.' });
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
