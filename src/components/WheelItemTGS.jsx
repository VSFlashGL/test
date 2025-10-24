import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import pako from 'pako';

/**
 * Компонент для отображения TGS анимации как элемента колеса
 */
const WheelItemTGS = ({ item }) => {
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadTGS = async () => {
      try {
        setLoading(true);
        setError(null);

        // Проверяем, есть ли URL для TGS
        if (!item.tgsUrl) {
          throw new Error('TGS URL не указан');
        }

        // Загружаем TGS файл
        const response = await fetch(item.tgsUrl);
        
        if (!response.ok) {
          throw new Error(`Не удалось загрузить файл: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Распаковываем gzip
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer), { to: 'string' });
        
        // Парсим JSON
        const lottieJson = JSON.parse(decompressed);
        
        setAnimationData(lottieJson);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки TGS:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadTGS();
  }, [item.tgsUrl]);

  // Если загружается
  if (loading) {
    return (
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{ width: '300px', height: '150px' }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${item.color}, ${adjustBrightness(item.color, -30)})`,
          }}
        >
          <div className="text-white text-6xl animate-pulse">
            {item.fallback || '⏳'}
          </div>
        </div>
      </div>
    );
  }

  // Если ошибка - показываем fallback
  if (error || !animationData) {
    return (
      <div 
        className="relative rounded-lg overflow-hidden shadow-lg"
        style={{ width: '300px', height: '150px' }}
      >
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${item.color}, ${adjustBrightness(item.color, -30)})`,
          }}
        >
          <div className="text-white text-6xl mb-2">
            {item.fallback || '❓'}
          </div>
          <div className="text-white text-sm opacity-75">
            {item.value}
          </div>
        </div>
      </div>
    );
  }

  // Успешная загрузка - показываем анимацию
  return (
    <div 
      className="relative transform transition-all duration-200 rounded-lg overflow-hidden shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '300px',
        height: '150px',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Фон с градиентом */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, ${item.color}, ${adjustBrightness(item.color, -30)})`,
        }}
      />
      
      {/* TGS Анимация */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ 
            width: '140px', 
            height: '140px',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
          }}
        />
      </div>

      {/* Текст снизу */}
      <div className="absolute bottom-2 left-0 right-0 z-20 text-center">
        <div className="text-white font-bold text-sm px-2 py-1 bg-black bg-opacity-40 rounded inline-block">
          {item.value}
        </div>
      </div>

      {/* Эффект блеска при hover */}
      {isHovered && (
        <div 
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
          }}
        />
      )}
    </div>
  );
};

// Вспомогательная функция для изменения яркости цвета
const adjustBrightness = (color, amount) => {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  
  const num = parseInt(col, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
};

export default WheelItemTGS;
