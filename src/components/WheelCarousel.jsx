import React, { useState, useEffect, useRef } from 'react';
import WheelItem from './WheelItem';
import WheelItemTGS from './WheelItemTGS';
import WheelItemJSON from './WheelItemJSON';

const WheelCarousel = () => {
  const [translateX, setTranslateX] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // ✅ 51 JSON анимация из папки animations
  const [items] = useState([
    { id: 1, type: 'json', value: 'B-Day Candle', jsonUrl: '/animations/01_emoji.json', color: '#FFD700', fallback: '🎁' },
    { id: 2, type: 'json', value: 'Desk Calendar', jsonUrl: '/animations/02_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 3, type: 'json', value: 'Homemade Cake', jsonUrl: '/animations/03_emoji.json', color: '#4ECDC4', fallback: '🎁' },
    { id: 4, type: 'json', value: 'Ring', jsonUrl: '/animations/04_emoji.json', color: '#95E1D3', fallback: '🎁' },
    { id: 5, type: 'json', value: 'Cup', jsonUrl: '/animations/05_emoji.json', color: '#F38181', fallback: '🎁' },
    { id: 6, type: 'json', value: 'Rocket', jsonUrl: '/animations/06_emoji.json', color: '#AA96DA', fallback: '🎁' },
    { id: 7, type: 'json', value: 'Flowers', jsonUrl: '/animations/07_emoji.json', color: '#FCBAD3', fallback: '🎁' },
    { id: 8, type: 'json', value: 'Rose', jsonUrl: '/animations/08_emoji.json', color: '#FFFFD2', fallback: '🎁' },
    { id: 9, type: 'json', value: 'Sakura Flower', jsonUrl: '/animations/09_emoji.json', color: '#FFD700', fallback: '🎁' },
    { id: 10, type: 'json', value: 'Lol Pop', jsonUrl: '/animations/10_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 11, type: 'json', value: 'Gift', jsonUrl: '/animations/11_emoji.json', color: '#4ECDC4', fallback: '🎁' },
    { id: 12, type: 'json', value: 'Bear', jsonUrl: '/animations/12_emoji.json', color: '#95E1D3', fallback: '🎁' },
    { id: 13, type: 'json', value: 'Heart', jsonUrl: '/animations/13_emoji.json', color: '#F38181', fallback: '🎁' },
    { id: 14, type: 'json', value: 'Spy Agaric', jsonUrl: '/animations/14_emoji.json', color: '#AA96DA', fallback: '🎁' },
    { id: 15, type: 'json', value: 'Eternal Candle', jsonUrl: '/animations/15_emoji.json', color: '#FCBAD3', fallback: '🎁' },
    { id: 16, type: 'json', value: 'Witch Hat', jsonUrl: '/animations/16_emoji.json', color: '#FFFFD2', fallback: '🎁' },
    { id: 17, type: 'json', value: 'Scared Cat', jsonUrl: '/animations/17_emoji.json', color: '#FFD700', fallback: '🎁' },
    { id: 18, type: 'json', value: 'Voodoo Doll', jsonUrl: '/animations/18_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 19, type: 'json', value: 'Flying Broom', jsonUrl: '/animations/19_emoji.json', color: '#4ECDC4', fallback: '🎁' },
    { id: 20, type: 'json', value: 'Crystal Ball', jsonUrl: '/animations/20_emoji.json', color: '#95E1D3', fallback: '🎁' },
    { id: 21, type: 'json', value: 'Skull Flower', jsonUrl: '/animations/21_emoji.json', color: '#F38181', fallback: '🎁' },
    { id: 22, type: 'json', value: 'Trapped Heart', jsonUrl: '/animations/22_emoji.json', color: '#AA96DA', fallback: '🎁' },
    { id: 23, type: 'json', value: 'Mad Pumpkin', jsonUrl: '/animations/23_emoji.json', color: '#FCBAD3', fallback: '🎁' },
    { id: 24, type: 'json', value: 'Sharp Tongue', jsonUrl: '/animations/24_emoji.json', color: '#FFFFD2', fallback: '🎁' },
    { id: 25, type: 'json', value: 'Vintage Cigar', jsonUrl: '/animations/25_emoji.json', color: '#FFD700', fallback: '�' },
    { id: 26, type: 'json', value: 'Berry Box', jsonUrl: '/animations/26_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 27, type: 'json', value: 'Eternal Rose', jsonUrl: '/animations/27_emoji.json', color: '#4ECDC4', fallback: '🎁' },
    { id: 28, type: 'json', value: 'Electric Skull', jsonUrl: '/animations/28_emoji.json', color: '#95E1D3', fallback: '🎁' },
    { id: 29, type: 'json', value: 'Hypno Lollipop', jsonUrl: '/animations/29_emoji.json', color: '#F38181', fallback: '🎁' },
    { id: 30, type: 'json', value: 'Kissed Frog', jsonUrl: '/animations/30_emoji.json', color: '#AA96DA', fallback: '�' },
    { id: 31, type: 'json', value: 'Jelly Bunnie', jsonUrl: '/animations/31_emoji.json', color: '#FCBAD3', fallback: '🎁' },
    { id: 32, type: 'json', value: 'Bunny Muffin', jsonUrl: '/animations/32_emoji.json', color: '#FFFFD2', fallback: '🎁' },
    { id: 33, type: 'json', value: 'Spiced Wine', jsonUrl: '/animations/33_emoji.json', color: '#FFD700', fallback: '🎁' },
    { id: 34, type: 'json', value: 'Xmas Stocking', jsonUrl: '/animations/34_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 35, type: 'json', value: 'Santa Hat', jsonUrl: '/animations/35_emoji.json', color: '#4ECDC4', fallback: '🎁' },
    { id: 36, type: 'json', value: 'Snow Globe', jsonUrl: '/animations/36_emoji.json', color: '#95E1D3', fallback: '🎁' },
    { id: 37, type: 'json', value: 'Winter Wreath', jsonUrl: '/animations/37_emoji.json', color: '#F38181', fallback: '🎁' },
    { id: 38, type: 'json', value: 'Star Notepad', jsonUrl: '/animations/38_emoji.json', color: '#AA96DA', fallback: '🎁' },
    { id: 39, type: 'json', value: 'Jester Hat', jsonUrl: '/animations/39_emoji.json', color: '#FCBAD3', fallback: '🎁' },
    { id: 40, type: 'json', value: 'Ginger Cookie', jsonUrl: '/animations/40_emoji.json', color: '#FFFFD2', fallback: '🎁' },
    { id: 41, type: 'json', value: 'Tama Gadget', jsonUrl: '/animations/41_emoji.json', color: '#FFD700', fallback: '🎁' },
    { id: 42, type: 'json', value: 'Snake Box', jsonUrl: '/animations/42_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 43, type: 'json', value: 'Pet Snake', jsonUrl: '/animations/43_emoji.json', color: '#4ECDC4', fallback: '🎁' },
    { id: 44, type: 'json', value: 'Big Year', jsonUrl: '/animations/44_emoji.json', color: '#95E1D3', fallback: '🎁' },
    { id: 45, type: 'json', value: 'Lunar Snake', jsonUrl: '/animations/45_emoji.json', color: '#F38181', fallback: '🎁' },
    { id: 46, type: 'json', value: 'Toy Bear', jsonUrl: '/animations/46_emoji.json', color: '#AA96DA', fallback: '🎁' },
    { id: 47, type: 'json', value: 'Diamond Ring', jsonUrl: '/animations/47_emoji.json', color: '#FCBAD3', fallback: '�' },
    { id: 48, type: 'json', value: 'Valentine Box', jsonUrl: '/animations/48_emoji.json', color: '#FFFFD2', fallback: '🎁' },
    { id: 49, type: 'json', value: 'Bow Tie', jsonUrl: '/animations/49_emoji.json', color: '#FFD700', fallback: '🎁' },
    { id: 50, type: 'json', value: 'Light Sword', jsonUrl: '/animations/50_emoji.json', color: '#FF6B6B', fallback: '🎁' },
    { id: 51, type: 'json', value: 'Fresh Socks', jsonUrl: '/animations/51_emoji.json', color: '#4ECDC4', fallback: '�' },
  ]);
  
  const containerRef = useRef(null);
  const itemWidth = 150; // ширина каждого элемента (уменьшено)
  const centerOffset = 2000; // начальное смещение для центрирования

  // Вычисляем позицию и прозрачность для каждого элемента
  const getItemStyle = (index) => {
    const basePosition = index * itemWidth;
    const position = basePosition + centerOffset;
    
    // Вычисляем расстояние от центра (центр карусели находится на translateX + center screen)
    const screenCenter = 250; // половина ширины контейнера (500px / 2)
    const itemCenter = position - translateX + (itemWidth / 2);
    const distanceFromCenter = Math.abs(itemCenter - screenCenter);
    
    // Вычисляем прозрачность на основе расстояния от центра
    let opacity = 0;
    if (distanceFromCenter < 75) { // центральный элемент
      opacity = 1;
    } else if (distanceFromCenter < 225) { // соседние элементы
      opacity = 0.4;
    }
    
    return {
      width: `${itemWidth}px`,
      opacity,
      transition: isSpinning ? 'opacity 1s ease-out' : 'opacity 0.3s ease-out',
    };
  };

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Случайное количество оборотов + финальная позиция
    const spins = 3 + Math.random() * 2; // 3-5 полных оборотов
    const totalItems = items.length;
    const finalIndex = Math.floor(Math.random() * totalItems);
    const finalPosition = -(spins * totalItems * itemWidth + finalIndex * itemWidth);
    
    setTranslateX(finalPosition);
    
    // Останавливаем после завершения анимации
    setTimeout(() => {
      setIsSpinning(false);
      // Показываем какой приз выпал
      const wonItem = items[finalIndex];
      console.log('🎉 Поздравляем! Вы выиграли:', wonItem.value);
      alert(`🎉 Поздравляем!\n\nВы выиграли: ${wonItem.value}`);
    }, 3000);
  };

  // Автоматическая прокрутка для демонстрации
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpinning) {
        setTranslateX(prev => prev - 0.5); // Медленная прокрутка
      }
    }, 20);
    
    return () => clearInterval(interval);
  }, [isSpinning]);

  return (
    <div className="text-center flex flex-col items-center" style={{ width: '100%' }}>
      <div 
        ref={containerRef}
        style={{ 
          height: '180px',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          padding: '20px 0'
        }}
      >
        {/* Индикатор центра */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '2px',
          height: '100%',
          background: 'linear-gradient(to bottom, #fbbf24, #f97316, #fbbf24)',
          zIndex: 10,
          boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            backgroundColor: '#fbbf24',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)'
          }}></div>
        </div>
        
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            transform: `translateX(${translateX}px)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
            willChange: 'transform'
          }}
        >
          {/* Создаем 3 копии для бесконечной прокрутки */}
          {[...Array(3)].map((_, setIndex) => (
            items.map((item, itemIndex) => {
              const globalIndex = setIndex * items.length + itemIndex;
              const style = getItemStyle(globalIndex);
              return (
                <div
                  key={`${setIndex}-${item.id}`}
                  style={{
                    ...style,
                    height: '140px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px'
                  }}
                >
                  {item.type === 'tgs' ? (
                    <WheelItemTGS item={item} />
                  ) : item.type === 'json' ? (
                    <WheelItemJSON item={item} />
                  ) : (
                    <WheelItem item={item} />
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
      
      <button
        onClick={spinWheel}
        disabled={isSpinning}
        style={{
          marginTop: '20px',
          padding: '12px 32px',
          borderRadius: '50px',
          fontWeight: 'bold',
          fontSize: '18px',
          color: 'white',
          border: 'none',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          background: isSpinning 
            ? 'linear-gradient(to right, #9ca3af, #9ca3af)' 
            : 'linear-gradient(to right, #4ade80, #3b82f6)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => !isSpinning && (e.target.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
      >
        {isSpinning ? '🎰 Вращается...' : '🎲 Крутить!'}
      </button>
    </div>
  );
};

export default WheelCarousel;
