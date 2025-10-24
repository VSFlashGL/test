// Пример использования TGS анимаций в проекте

import React from 'react';
import TGSAnimation from './TGSAnimation';

/**
 * Демо-компонент для демонстрации TGS анимаций
 * 
 * КАК ИСПОЛЬЗОВАТЬ:
 * 1. Скачайте .tgs файлы (например, с https://t.me/addstickers/)
 * 2. Поместите их в папку public/animations/
 * 3. Используйте компонент TGSAnimation
 * 
 * ПРИМЕР:
 * <TGSAnimation 
 *   tgsUrl="/animations/sticker.tgs"
 *   width={300}
 *   height={300}
 *   loop={true}
 *   autoplay={true}
 * />
 */

const TGSDemo = () => {
  // Примеры популярных TGS стикеров (нужно скачать и поместить в public/animations/)
  const exampleStickers = [
    { name: 'Огонь', url: '/animations/fire.tgs' },
    { name: 'Звезда', url: '/animations/star.tgs' },
    { name: 'Сердце', url: '/animations/heart.tgs' },
    { name: 'Деньги', url: '/animations/money.tgs' },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-purple-600 to-blue-500 min-h-screen">
      <h1 className="text-4xl font-bold text-white text-center mb-8">
        🎭 TGS Анимации - Демо
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {exampleStickers.map((sticker, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-center mb-4">{sticker.name}</h3>
            <TGSAnimation
              tgsUrl={sticker.url}
              width={200}
              height={200}
              loop={true}
              autoplay={true}
            />
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">📝 Инструкция:</h2>
        <ol className="text-white space-y-2 list-decimal list-inside">
          <li>Скачайте .tgs файлы (стикеры Telegram)</li>
          <li>Создайте папку <code className="bg-black bg-opacity-30 px-2 py-1 rounded">public/animations/</code></li>
          <li>Поместите туда .tgs файлы</li>
          <li>Используйте компонент TGSAnimation с путем к файлу</li>
        </ol>
        
        <h3 className="text-xl font-bold text-white mt-6 mb-3">Где взять TGS:</h3>
        <ul className="text-white space-y-1 list-disc list-inside">
          <li>Telegram стикер-паки</li>
          <li>LottieFiles (экспорт в TGS)</li>
          <li>Создать свои в Adobe After Effects + Bodymovin</li>
        </ul>

        <div className="mt-6 bg-yellow-500 bg-opacity-20 border-2 border-yellow-400 rounded-lg p-4">
          <p className="text-yellow-100">
            💡 <strong>Совет:</strong> TGS файлы должны быть меньше 64KB для оптимальной загрузки
          </p>
        </div>
      </div>
    </div>
  );
};

export default TGSDemo;
