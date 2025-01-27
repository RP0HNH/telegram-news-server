const express = require('express');
const bodyParser = require('body-parser');
const { setupBot } = require('./bot');
const { setupRoutes } = require('./routes');

const app = express();
app.use(bodyParser.json());

// Настройка маршрутов
setupRoutes(app);

// Инициализация Telegram-бота
setupBot();

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
