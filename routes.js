const fs = require('fs');
const path = require('path');

// Пути к файлам
const DATA_FILE = path.join(__dirname, 'posts.json');
const MEDIA_DIR = path.join(__dirname, 'media');

const setupRoutes = (app) => {
    // Эндпоинт для получения списка постов
    app.get('/posts', (req, res) => {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            res.json(data);
        } else {
            res.json([]);
        }
    });

    // Эндпоинт для очистки данных
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
};

module.exports = { setupRoutes };
