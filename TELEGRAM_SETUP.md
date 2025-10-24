# 🎰 Настройка Telegram Web App для рулетки

## ✅ Что уже настроено:

### 1. **Telegram Web App SDK** 
- ✅ Подключен скрипт в `index.html`
- ✅ Инициализация в `SimpleWheel.jsx`
- ✅ Автоматическое расширение на весь экран
- ✅ Адаптация под темы Telegram (темная/светлая)

### 2. **Адаптивный дизайн**
- ✅ Safe Area для iPhone с вырезом (notch)
- ✅ Правильная высота viewport с учетом header Telegram
- ✅ Touch-оптимизация для мобильных устройств
- ✅ Плавная прокрутка с поддержкой `-webkit-overflow-scrolling`
- ✅ Адаптивная сетка призов для всех размеров экранов

### 3. **Оптимизация производительности**
- ✅ Отключен overscroll на iOS
- ✅ Убран `background-attachment: fixed` для лучшей производительности
- ✅ Добавлен `touch-action` для корректной обработки касаний

## 📱 Тестирование в Telegram:

### Локальное тестирование:
1. Запустите проект: `npm start`
2. Используйте ngrok для публичного URL:
   ```bash
   ngrok http 3000
   ```
3. Скопируйте HTTPS URL из ngrok

### Создание бота в Telegram:
1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Получите токен бота

### Настройка Web App:
1. Отправьте боту команду: `/newapp`
2. Выберите своего бота
3. Укажите название и описание
4. Загрузите иконку (512x512 px)
5. **Важно!** Вставьте HTTPS URL (из ngrok или вашего хостинга)
6. Отправьте короткое название (для URL)

### Добавление кнопки в бота:
В коде бота (Python/Node.js) добавьте кнопку:

**Python (python-telegram-bot):**
```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

button = InlineKeyboardButton(
    text="🎰 Крутить рулетку",
    web_app=WebAppInfo(url="https://ваш-url.com")
)
keyboard = InlineKeyboardMarkup([[button]])
await update.message.reply_text("Нажми кнопку:", reply_markup=keyboard)
```

**Node.js (node-telegram-bot-api):**
```javascript
bot.sendMessage(chatId, 'Нажми кнопку:', {
  reply_markup: {
    inline_keyboard: [[
      { text: '🎰 Крутить рулетку', web_app: { url: 'https://ваш-url.com' } }
    ]]
  }
});
```

## 🚀 Деплой в продакшн:

### Рекомендуемые платформы (бесплатные):
1. **Vercel** (рекомендуется)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm run build
   # Загрузите папку build на netlify.com
   ```

3. **GitHub Pages**
   ```bash
   npm install --save-dev gh-pages
   npm run build
   npm run deploy
   ```

## 🔐 Безопасность:

### Валидация данных от Telegram:
В вашем боте проверяйте `initData` от Telegram Web App:

```javascript
// В SimpleWheel.jsx уже доступен объект tg
const initData = tg?.initData;
const userId = tg?.initDataUnsafe?.user?.id;

// Отправьте эти данные на ваш backend для валидации
```

### На backend (Node.js):
```javascript
const crypto = require('crypto');

function validateTelegramWebAppData(initData, botToken) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}
```

## 💰 Интеграция платежей Telegram Stars:

Для добавления оплаты через Telegram Stars (будущая функциональность):

```javascript
// В SimpleWheel.jsx после выбора уровня рулетки
const handlePayment = (tier) => {
  const prices = {
    basic: 200,
    premium: 1500,
    elite: 15000
  };
  
  // Отправка запроса платежа через бота
  tg.sendData(JSON.stringify({
    action: 'payment',
    tier: tier,
    amount: prices[tier]
  }));
  
  tg.close();
};
```

## 📊 Получение результатов в боте:

```javascript
// После выигрыша отправляем данные в бота
const sendResultToBot = (prize) => {
  tg.sendData(JSON.stringify({
    action: 'prize_won',
    prize: prize.name,
    prizeId: prize.id,
    tier: selectedTier,
    userId: tg.initDataUnsafe?.user?.id
  }));
};

// Вызывайте эту функцию в finishSpin()
```

## 🎨 Кастомизация под ваш бренд:

1. **Цвета**: Измените в `TIER_CONFIG` в `SimpleWheel.jsx`
2. **Призы**: Обновите `PRIZE_NAMES` и файлы анимаций в `/public/animations/`
3. **Цены**: Измените `price` в `TIER_CONFIG`

## ❓ Частые вопросы:

**Q: Не открывается в Telegram на iPhone?**
A: Проверьте, что используете HTTPS URL (ngrok предоставляет автоматически)

**Q: Высота некорректная на Android?**
A: Убедитесь, что вызван `tg.expand()` (уже добавлено в коде)

**Q: Как протестировать без деплоя?**
A: Используйте ngrok для получения временного HTTPS URL

**Q: Можно ли использовать на десктопе?**
A: Да! Web App корректно работает и в десктопной версии Telegram

## 📞 Полезные ссылки:

- [Telegram Web Apps Documentation](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Stars для платежей](https://core.telegram.org/bots/payments)

---

**Готово! 🎉** Ваш Web App теперь полностью готов для интеграции с Telegram!
