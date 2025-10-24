import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import pako from 'pako';

/**
 * Компонент для отображения TGS анимаций (формат Telegram Stickers)
 * TGS - это gzip-сжатый JSON формат Lottie
 */
const TGSAnimation = ({ tgsUrl, width = 300, height = 300, loop = true, autoplay = true }) => {
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTGS = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем TGS файл
        const response = await fetch(tgsUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Распаковываем gzip
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer), { to: 'string' });
        
        // Парсим JSON
        const lottieJson = JSON.parse(decompressed);
        
        setAnimationData(lottieJson);
        setLoading(false);
      } catch (err) {
        console.error('Error loading TGS animation:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (tgsUrl) {
      loadTGS();
    }
  }, [tgsUrl]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-200 rounded-lg animate-pulse"
        style={{ width, height }}
      >
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-100 rounded-lg"
        style={{ width, height }}
      >
        <div className="text-red-500 text-sm p-4">
          Ошибка загрузки: {error}
        </div>
      </div>
    );
  }

  if (!animationData) {
    return null;
  }

  return (
    <div style={{ width, height }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default TGSAnimation;
