const fs = require('fs');
const path = require('path');
const https = require('https');

// Папка для медиа-файлов
const MEDIA_DIR = path.join(__dirname, '../media');

// Создаем папку, если она не существует
if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Функция для сохранения медиа-файлов
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

// Функция для сохранения поста в JSON
const savePost = (post) => {
    const DATA_FILE = path.join(__dirname, '../posts.json');
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

module.exports = { saveMediaFile, savePost };
