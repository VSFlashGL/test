import React, { useRef, useEffect, useState } from 'react';

const WheelItem = ({ item }) => {
  const canvasRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 300;

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Создаем градиент фона
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, item.color);
    gradient.addColorStop(1, adjustBrightness(item.color, -30));

    // Рисуем закругленный прямоугольник с тенью
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = gradient;
    roundRect(ctx, 20, 20, width - 40, height - 40, 30);
    ctx.fill();

    // Убираем тень для текста
    ctx.shadowColor = 'transparent';

    // Рисуем текст
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Добавляем обводку тексту для лучшей читаемости
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(item.value, width / 2, height / 2);
    ctx.fillText(item.value, width / 2, height / 2);

    // Добавляем блеск
    if (isHovered) {
      const shineGradient = ctx.createLinearGradient(0, 0, width, 0);
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = shineGradient;
      roundRect(ctx, 20, 20, width - 40, height - 40, 30);
      ctx.fill();
    }

  }, [item, isHovered]);

  // Вспомогательная функция для рисования закругленного прямоугольника
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
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

  return (
    <div 
      className="relative transform transition-transform duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="canvas-item rounded-lg"
        width="600"
        height="300"
        style={{ width: '300px', height: '150px' }}
      />
    </div>
  );
};

export default WheelItem;
