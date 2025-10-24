import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';

const ITEM_WIDTH = 160;
const TRACK_COPIES = 3; // три копии набора призов, чтобы не было видимых швов

// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;

// Названия призов из WheelCarousel.jsx
const PRIZE_NAMES = [
  'B-Day Candle', 'Desk Calendar', 'Homemade Cake', 'Ring', 'Cup', 'Rocket', 'Flowers', 'Rose',
  'Sakura Flower', 'Lol Pop', 'Gift', 'Bear', 'Heart', 'Spy Agaric', 'Eternal Candle', 'Witch Hat',
  'Scared Cat', 'Voodoo Doll', 'Flying Broom', 'Crystal Ball', 'Skull Flower', 'Trapped Heart',
  'Mad Pumpkin', 'Sharp Tongue', 'Vintage Cigar', 'Berry Box', 'Eternal Rose', 'Electric Skull',
  'Hypno Lollipop', 'Kissed Frog', 'Jelly Bunnie', 'Bunny Muffin', 'Spiced Wine', 'Xmas Stocking',
  'Santa Hat', 'Snow Globe', 'Winter Wreath', 'Star Notepad', 'Jester Hat', 'Ginger Cookie',
  'Tama Gadget', 'Snake Box', 'Pet Snake', 'Big Year', 'Lunar Snake', 'Toy Bear', 'Diamond Ring',
  'Valentine Box', 'Bow Tie', 'Light Sword', 'Fresh Socks'
];

// Конфигурация уровней рулеток
const TIER_CONFIG = {
  basic: {
    name: 'Базовая',
    nameGenitive: 'базовой', // Родительный падеж для "Загрузка базовой рулетки"
    price: 200,
    color: '#3b82f6',
    prizeRange: [1, 17], // Призы 1-17
    icon: '⭐'
  },
  premium: {
    name: 'Премиум',
    nameGenitive: 'премиум', // "Загрузка премиум рулетки"
    price: 1500,
    color: '#8b5cf6',
    prizeRange: [18, 34], // Призы 18-34
    icon: '💎'
  },
  elite: {
    name: 'Элитная',
    nameGenitive: 'элитной', // "Загрузка элитной рулетки"
    price: 15000,
    color: '#f59e0b',
    prizeRange: [35, 51], // Призы 35-51
    icon: '👑'
  }
};

const SimpleWheel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [visualOffset, setVisualOffset] = useState(0);
  const [resultItem, setResultItem] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedTier, setSelectedTier] = useState('basic'); // Выбранный уровень рулетки
  const [currentFilteredItems, setCurrentFilteredItems] = useState([]); // Кешируем отфильтрованные элементы
  const [isTransitioning, setIsTransitioning] = useState(false); // Флаг переключения
  const [targetTier, setTargetTier] = useState('basic'); // Целевой уровень для отображения в загрузке
  // Навигация по разделам
  const [activeScreen, setActiveScreen] = useState('home'); // 'home' | 'free' | 'referral' | 'roulette'
  // Балансы пользователя (заглушки)
  const [gemsBalance, setGemsBalance] = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);

  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const decelerationRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const rafRef = useRef(null);
  const prevTimeRef = useRef(null);
  const lastTapRef = useRef(null); // Для отслеживания двойного нажатия (null = еще не было кликов)

  // Инициализация Telegram Web App
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand(); // Разворачиваем на весь экран
      tg.enableClosingConfirmation(); // Подтверждение при закрытии
      
      // Устанавливаем цвета темы
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0f0c29');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || 'rgba(255, 255, 255, 0.7)');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#8b5cf6');
      
      // Устанавливаем правильную высоту viewport
      const setViewportHeight = () => {
        const vh = tg.viewportHeight || window.innerHeight;
        const stableVh = tg.viewportStableHeight || window.innerHeight;
        document.documentElement.style.setProperty('--tg-viewport-height', `${vh}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${stableVh}px`);
      };
      
      setViewportHeight();
      tg.onEvent('viewportChanged', setViewportHeight);
      
      return () => {
        tg.offEvent('viewportChanged', setViewportHeight);
      };
    }
  }, []);

  useEffect(() => {
    const loadAnimations = async () => {
      const loadedItems = [];

      for (let i = 1; i <= 51; i++) {
        const paddedNum = String(i).padStart(2, '0');
        try {
          const response = await fetch(`/animations/${paddedNum}_emoji.json`);
          if (!response.ok) {
            throw new Error('Failed to fetch');
          }
          const data = await response.json();
          loadedItems.push({ 
            id: i, 
            data,
            animation: data, // Добавляем animation для использования в модальном окне
            name: PRIZE_NAMES[i - 1] || `Prize #${i}`,
            emoji: '🎁'
          });
        } catch (error) {
          console.warn(`Fallback for animation ${i}`, error);
          loadedItems.push({ 
            id: i, 
            data: null,
            animation: null, 
            emoji: '🎁', 
            name: PRIZE_NAMES[i - 1] || `Prize #${i}`
          });
        }
      }

      // Перемешиваем призы в случайном порядке (Fisher-Yates shuffle)
      for (let i = loadedItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [loadedItems[i], loadedItems[j]] = [loadedItems[j], loadedItems[i]];
      }

      setItems(loadedItems);
      setLoading(false);
    };

    loadAnimations();
  }, []);

  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  // Получить призы для выбранного уровня
  const getFilteredItems = () => {
    const config = TIER_CONFIG[selectedTier];
    const [start, end] = config.prizeRange;
    return items.filter(item => item.id >= start && item.id <= end);
  };

  // Плавное переключение уровня
  const handleTierChange = (newTier) => {
    if (spinning || isTransitioning || newTier === selectedTier) return;
    
    setTargetTier(newTier); // Устанавливаем целевой уровень для отображения
    setIsTransitioning(true);
    
    // Задержка для показа анимации загрузки
    setTimeout(() => {
      setSelectedTier(newTier);
      // Даем время на загрузку новых призов
      setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
    }, 300);
  };

  // Обновляем кешированные отфильтрованные элементы при изменении items или selectedTier
  useEffect(() => {
    if (items.length > 0) {
      // Используем requestAnimationFrame для плавного обновления
      requestAnimationFrame(() => {
        const filtered = getFilteredItems();
        setCurrentFilteredItems(filtered);
      });
    }
  }, [items, selectedTier]);

  useEffect(() => {
    if (!loading && currentFilteredItems.length) {
      const cycle = currentFilteredItems.length * ITEM_WIDTH;
      const baseOffset = cycle;
      offsetRef.current = baseOffset;
      setVisualOffset(baseOffset);
    }
  }, [loading, currentFilteredItems]);

  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const closeResult = () => {
    setShowResult(false);
    setTimeout(() => setResultItem(null), 250);
  };

  const getIndexFromOffset = (offsetValue, filteredItemsArray) => {
    if (!filteredItemsArray.length) return 0;
    // Более точное округление до ближайшего целого индекса
    const rawIndex = Math.round(offsetValue / ITEM_WIDTH);
    const normalized = ((rawIndex % filteredItemsArray.length) + filteredItemsArray.length) % filteredItemsArray.length;
    return normalized;
  };

  const updateVisualOffset = (offsetValue, filteredItemsArray) => {
    if (!filteredItemsArray.length) return;
    const cycle = filteredItemsArray.length * ITEM_WIDTH;
    const baseOffset = cycle;
    // Используем точное значение offset без округления для плавности движения
    const normalized = ((offsetValue % cycle) + cycle) % cycle;
    setVisualOffset(baseOffset + normalized);
  };

  const finishSpin = () => {
    const winningIndex = getIndexFromOffset(targetOffsetRef.current, currentFilteredItems);
    // Точно выравниваем по индексу, без дробных значений
    const alignedOffset = Math.round(winningIndex) * ITEM_WIDTH;
    offsetRef.current = alignedOffset;
    updateVisualOffset(alignedOffset, currentFilteredItems);

    setSpinning(false);
    setResultItem(currentFilteredItems[winningIndex]);
    setTimeout(() => setShowResult(true), 180);
  };

  const stepAnimation = (timestamp) => {
    if (!prevTimeRef.current) {
      prevTimeRef.current = timestamp;
    }

    const delta = (timestamp - prevTimeRef.current) / 1000;
    prevTimeRef.current = timestamp;

    let velocity = velocityRef.current;
    let offset = offsetRef.current;
    const target = targetOffsetRef.current;

    offset += velocity * delta;
    velocity = Math.max(velocity - decelerationRef.current * delta, 0);

    if (offset >= target) {
      // Точно выравниваем по сетке при остановке
      offset = Math.round(target / ITEM_WIDTH) * ITEM_WIDTH;
      velocity = 0;
    }

    offsetRef.current = offset;
    velocityRef.current = velocity;
    updateVisualOffset(offset, currentFilteredItems);

    if (velocity > 0) {
      rafRef.current = requestAnimationFrame(stepAnimation);
    } else {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      finishSpin();
    }
  };

  const spin = () => {
    if (loading || !items.length) return;

    if (!currentFilteredItems.length) return;

    const now = Date.now();
    const timeSinceLastTap = lastTapRef.current ? now - lastTapRef.current : Infinity;
    console.log('⏱️ Time since last tap:', timeSinceLastTap, 'ms', 'spinning:', spinning);

    // Если быстрое двойное нажатие (меньше 300ms) - мгновенный результат
    if (timeSinceLastTap < 300) {
      console.log('⚡ DOUBLE CLICK detected! Showing instant result');
      // Останавливаем текущую анимацию если она есть
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      velocityRef.current = 0;
      
      // Мгновенно показываем результат без анимации
      const randomIndex = Math.floor(Math.random() * currentFilteredItems.length);
      setSpinning(false);
      setResultItem(currentFilteredItems[randomIndex]);
      setShowResult(true);
      lastTapRef.current = null; // Сбрасываем для следующего раза
      return;
    }

    // Если уже идет анимация - игнорируем клики
    if (spinning) {
      console.log('🚫 Spinning already, ignoring click');
      return;
    }

    // Запуск анимации вращения (первый клик)
    console.log('🎲 Starting spin animation');
    lastTapRef.current = now;

    setSpinning(true);
    setShowResult(false);
    setResultItem(null);

    const cycle = currentFilteredItems.length * ITEM_WIDTH;
    const baseOffset = cycle;

    if (offsetRef.current === 0) {
      offsetRef.current = baseOffset;
      setVisualOffset(baseOffset);
    }

    const randomIndex = Math.floor(Math.random() * currentFilteredItems.length);
    const spins = 2.5 + Math.random() * 1; // 2.5-3.5 полных оборотов
    const distance = spins * cycle + randomIndex * ITEM_WIDTH;

    const initialVelocity = 2500; // px/sec — уменьшена скорость для более плавного движения
    velocityRef.current = initialVelocity;
    // Плавное замедление
    decelerationRef.current = (initialVelocity ** 2) / (2 * distance);
    // Точно выравниваем target по сетке ITEM_WIDTH
    const targetOffset = Math.round((offsetRef.current + distance) / ITEM_WIDTH) * ITEM_WIDTH;
    targetOffsetRef.current = targetOffset;
    prevTimeRef.current = null;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(stepAnimation);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '1.5rem'
      }}>
        {/* Мягкие светящиеся пятна на фоне */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60vmax',
          height: '60vmax',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '50vmax',
          height: '50vmax',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Контент загрузки */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          {/* Логотип WheelGem с кольцом загрузки и кристаллом */}
          <div style={{
            position: 'relative',
            width: 'clamp(96px, 18vw, 140px)',
            height: 'clamp(96px, 18vw, 140px)'
          }}>
            {/* Внешнее кольцо-спиннер */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '5px solid rgba(139, 92, 246, 0.18)',
              borderTop: '5px solid #8b5cf6',
              animation: 'spin 1.1s linear infinite',
              boxShadow: '0 0 25px rgba(139,92,246,0.35) inset'
            }} />
            {/* Внутренний кристалл LuckGem — SVG с гранями, свечением и шиммером */}
            <svg
              viewBox="0 0 100 100"
              style={{ position: 'absolute', inset: '12%', pointerEvents: 'none' }}
            >
              <defs>
                {/* Градиент заливки кристалла */}
                <linearGradient id="lg-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="45%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                {/* Градиент блика (для скользящего шиммера) */}
                <linearGradient id="lg-shine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="45%" stopColor="rgba(255,255,255,0.85)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                {/* Радиационный фон в круге под кристаллом */}
                <radialGradient id="lg-bg" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="rgba(125,211,252,0.35)" />
                  <stop offset="55%" stopColor="rgba(125,211,252,0.18)" />
                  <stop offset="85%" stopColor="rgba(99,102,241,0.10)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                {/* Обрезка по кругу, чтобы не было квадратных артефактов */}
                <clipPath id="lg-clip">
                  <circle cx="50" cy="50" r="46" />
                </clipPath>
                {/* Мягкое внешнее свечение */}
                <filter id="lg-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Лёгкое подпрыгивание всего кристалла */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 0 -2; 0 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
                {/* Круглый фон-ореол под кристаллом */}
                <circle cx="50" cy="50" r="46" fill="url(#lg-bg)" />

                {/* Основная форма кристалла (пятиугольник) */}
                <polygon
                  points="50,6 86,36 72,92 28,92 14,36"
                  fill="url(#lg-grad)"
                  stroke="#a5f3fc"
                  strokeOpacity="0.6"
                  strokeWidth="1.2"
                  filter="url(#lg-glow)"
                />

                {/* Фасеты — треугольники с прозрачностью для глубины */}
                <polygon points="50,6 70,40 30,40" fill="#ffffff" opacity="0.15" />
                <polygon points="30,40 50,85 14,36" fill="#22d3ee" opacity="0.18" />
                <polygon points="70,40 50,85 86,36" fill="#60a5fa" opacity="0.18" />
                <polygon points="30,40 70,40 50,85" fill="#67e8f9" opacity="0.22" />

                {/* Внутренний блик */}
                <ellipse cx="42" cy="32" rx="9" ry="5" fill="#fff" opacity="0.35">
                  <animate
                    attributeName="opacity"
                    values="0.15;0.4;0.15"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                {/* Скользящий шиммер поверх кристалла, обрезанный по кругу */}
                <g opacity="0.65" style={{ mixBlendMode: 'screen' }} clipPath="url(#lg-clip)">
                  <rect x="-120" y="-20" width="80" height="160" fill="url(#lg-shine)" transform="rotate(-20 50 50)">
                    <animate
                      attributeName="x"
                      from="-120"
                      to="160"
                      dur="1.9s"
                      repeatCount="indefinite"
                    />
                  </rect>
                </g>
              </g>
            </svg>
          </div>

          {/* Бренд и статус */}
          <div style={{
            fontSize: 'clamp(1.25rem, 4.5vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textShadow: '0 2px 18px rgba(0,0,0,0.35)'
          }}>
            WheelGem
          </div>
          <div style={{
            fontSize: 'clamp(0.95rem, 2.6vw, 1.15rem)',
            color: 'rgba(255,255,255,0.9)'
          }}>
            {tg ? 'Инициализация Telegram…' : 'Подготовка призов…'}
          </div>
          <div style={{
            fontSize: 'clamp(0.8rem, 2.2vw, 0.95rem)',
            color: 'rgba(255,255,255,0.65)'
          }}>
            LuckGem загружается — почти готово
          </div>
        </div>
      </div>
    );
  }

  // --- Главный экран (Home) с балансами и кнопками разделов ---
  if (activeScreen === 'home') {
    return (
      <div style={{
        minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 'clamp(0.75rem, 2.5vw, 1.5rem)',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        color: '#fff'
      }}>
        {/* Фоновые мягкие круги */}
        <div style={{ position: 'absolute', top: '8%', left: '6%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.14), transparent 70%)', borderRadius: '50%', filter: 'blur(38px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 240, height: 240, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%)', borderRadius: '50%', filter: 'blur(36px)' }} />

        {/* Шапка с балансами */}
        <div style={{
          width: '100%',
          maxWidth: 920,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: 'clamp(1rem, 3.2vw, 1.75rem)'
        }}>
          {/* Баланс LuckGem слева */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.6rem 0.8rem',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(125,211,252,0.25)', borderRadius: 12,
            boxShadow: '0 6px 14px rgba(34,211,238,0.18) inset'
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: 'linear-gradient(160deg, #7dd3fc, #22d3ee 45%, #60a5fa)', boxShadow: '0 0 10px rgba(125,211,252,0.5)' }} />
            <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>LuckGem</div>
            <div style={{ fontWeight: 700 }}>{gemsBalance}</div>
          </div>

          {/* Баланс Stars справа */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.6rem 0.8rem',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12,
            boxShadow: '0 6px 14px rgba(245,158,11,0.18) inset'
          }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #fff, #fde68a 55%, #f59e0b)', boxShadow: '0 0 10px rgba(245,158,11,0.45)' }} />
            <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>Stars</div>
            <div style={{ fontWeight: 700 }}>{starsBalance}</div>
            <button
              onClick={() => alert('Пополнение Stars будет доступно скоро')}
              style={{
                marginLeft: '0.25rem',
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
                color: '#0f0c29', fontWeight: 800, border: 'none', cursor: 'pointer',
                boxShadow: '0 6px 14px rgba(245,158,11,0.35)'
              }}
              aria-label="Пополнить Stars"
            >
              +
            </button>
          </div>
        </div>

        {/* Название/бренд */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(0.6rem, 2vw, 1rem)' }}>
          <div style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: 0.5 }}>WheelGem</div>
          <div style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)', color: 'rgba(255,255,255,0.8)' }}>Играй. Выигрывай. Делись.</div>
        </div>

        {/* Кнопки-разделы */}
        <div style={{
          width: '100%', maxWidth: 920,
          display: 'grid', gap: 'clamp(0.8rem, 2.2vw, 1.25rem)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
        }}>
          {/* Бесплатная рулетка */}
          <button
            onClick={() => setActiveScreen('free')}
            style={{
              aspectRatio: '1 / 1',
              borderRadius: 16,
              border: '1px solid rgba(125,211,252,0.28)',
              background: 'linear-gradient(160deg, rgba(125,211,252,0.10), rgba(34,211,238,0.10))',
              color: '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 22px rgba(34,211,238,0.12)',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #8b5cf6, #3b82f6, #22d3ee, #8b5cf6)',
              boxShadow: '0 0 18px rgba(139,92,246,0.35)'
            }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Бесплатная рулетка</div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>1 спин каждый день</div>
          </button>

          {/* Реферальная система */}
          <button
            onClick={() => setActiveScreen('referral')}
            style={{
              aspectRatio: '1 / 1',
              borderRadius: 16,
              border: '1px solid rgba(139,92,246,0.28)',
              background: 'linear-gradient(160deg, rgba(139,92,246,0.12), rgba(59,130,246,0.10))',
              color: '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 22px rgba(139,92,246,0.14)',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              boxShadow: '0 0 18px rgba(59,130,246,0.35)'
            }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Реферальная система</div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>Зови друзей — копи LuckGem</div>
          </button>
        </div>

        {/* Низ страницы (немного отступа) */}
        <div style={{ height: 'clamp(1rem, 4vw, 2rem)' }} />
      </div>
    );
  }

  // --- Заглушки для разделов ---
  if (activeScreen === 'free' || activeScreen === 'referral') {
    const title = activeScreen === 'free' ? 'Бесплатная рулетка' : 'Реферальная система';
    const hint = activeScreen === 'free' ? 'Раздел скоро будет доступен' : 'Скоро добавим приглашения и бонусы';
    return (
      <div style={{
        minHeight: 'var(--tg-viewport-stable-height, 100vh)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
        padding: 'clamp(0.75rem, 2.5vw, 1.5rem)',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', color: '#fff'
      }}>
        {/* Шапка с кнопкой назад */}
        <div style={{ width: '100%', maxWidth: 920, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button onClick={() => setActiveScreen('home')} style={{
            border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', color: '#fff',
            padding: '0.45rem 0.7rem', borderRadius: 10, cursor: 'pointer'
          }}>← Назад</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(125,211,252,0.25)', borderRadius: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: 'linear-gradient(160deg, #7dd3fc, #22d3ee 45%, #60a5fa)' }} />
              <div style={{ fontSize: '0.9rem' }}>LuckGem</div>
              <strong>{gemsBalance}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #fff, #fde68a 55%, #f59e0b)' }} />
              <div style={{ fontSize: '0.9rem' }}>Stars</div>
              <strong>{starsBalance}</strong>
            </div>
          </div>
        </div>

        {/* Контент-заглушка */}
        <div style={{
          flex: 1, width: '100%', maxWidth: 920,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '1rem'
        }}>
          <div>
            <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 800, marginBottom: '0.5rem' }}>{title}</div>
            <div style={{ fontSize: 'clamp(0.95rem, 2.4vw, 1.1rem)', color: 'rgba(255,255,255,0.8)' }}>{hint}</div>
          </div>
        </div>
      </div>
    );
  }

  const extendedItems = currentFilteredItems.length
    ? Array.from({ length: currentFilteredItems.length * TRACK_COPIES }, (_, idx) => ({
        data: currentFilteredItems[idx % currentFilteredItems.length],
        idx
      }))
    : [];

  const tierConfig = TIER_CONFIG[selectedTier];

  return (
    <div style={{
      minHeight: 'var(--tg-viewport-stable-height, 100vh)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 2.5vw, 1.5rem)',
      paddingBottom: 'clamp(1rem, 3vw, 2rem)',
      position: 'relative',
      overflow: 'hidden auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Animated background circles */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 6s ease-in-out infinite reverse'
      }} />
      
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'clamp(1rem, 3vw, 2rem)',
        marginTop: 'clamp(0.5rem, 2vw, 1rem)',
        position: 'relative',
        zIndex: 1,
        width: '100%'
      }}>
        <h1 style={{
          color: `${tierConfig.color}`,
          fontSize: 'clamp(1.8rem, 6vw, 3rem)',
          marginBottom: '0.5rem',
          fontWeight: 800,
          backgroundImage: `linear-gradient(135deg, ${tierConfig.color}, #3b82f6, #06b6d4)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em',
          opacity: isTransitioning ? 0 : 1,
          visibility: 'visible',
          display: 'block',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)'
        }}>
          {tierConfig.icon} {tierConfig.name} Рулетка
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          fontWeight: 400,
          maxWidth: '500px',
          margin: '0 auto',
          opacity: isTransitioning ? 0 : 1,
          visibility: 'visible',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          transform: isTransitioning ? 'translateY(-10px)' : 'translateY(0)'
        }}>
          Крути колесо за {tierConfig.price} ⭐ и выигрывай призы! 🚀
        </p>
      </div>

      {/* Loading overlay при переключении уровней */}
      {isTransitioning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 12, 41, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            {/* Анимированная рулетка */}
            <div style={{
              width: 'clamp(80px, 15vw, 120px)',
              height: 'clamp(80px, 15vw, 120px)',
              border: '4px solid rgba(139, 92, 246, 0.2)',
              borderTop: `4px solid ${TIER_CONFIG[targetTier].color}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 40px ${TIER_CONFIG[selectedTier].color}66`
            }} />
            
            {/* Текст загрузки */}
            <div style={{
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{
                fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: TIER_CONFIG[targetTier].color,
                textShadow: `0 0 20px ${TIER_CONFIG[targetTier].color}66`,
                opacity: 1,
                visibility: 'visible'
              }}>
                {TIER_CONFIG[targetTier].icon} Загрузка {TIER_CONFIG[targetTier].nameGenitive} рулетки...
              </div>
              <div style={{
                fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                color: 'rgba(255, 255, 255, 0.8)',
                opacity: 1,
                visibility: 'visible'
              }}>
                Подготовка призов
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roulette container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'min(720px, 98vw)',
        height: 'clamp(160px, 28vw, 220px)',
        overflow: 'hidden',
        background: spinning
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.25))'
          : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'clamp(14px, 2.5vw, 20px)',
        marginBottom: 'clamp(1rem, 3vw, 2rem)',
        boxShadow: spinning
          ? '0 0 80px rgba(139, 92, 246, 0.6), inset 0 0 100px rgba(139, 92, 246, 0.2), 0 20px 60px rgba(0, 0, 0, 0.4)'
          : '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease-out',
        border: spinning 
          ? '2px solid rgba(139, 92, 246, 0.6)' 
          : '2px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1,
        touchAction: 'none',
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
        pointerEvents: isTransitioning ? 'none' : 'auto'
      }}>
        {/* Center indicator */}
                {/* Center indicator line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: spinning ? '6px' : '5px',
          background: 'linear-gradient(to bottom, transparent, #8b5cf6 20%, #3b82f6 50%, #8b5cf6 80%, transparent)',
          transform: 'translateX(-50%)',
          zIndex: 15,
          boxShadow: spinning
            ? '0 0 60px rgba(139, 92, 246, 1), 0 0 100px rgba(59, 130, 246, 0.9)'
            : '0 0 35px rgba(139, 92, 246, 1), 0 0 50px rgba(59, 130, 246, 0.7)',
          transition: 'all 0.3s ease',
          filter: 'brightness(1.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: spinning ? 'clamp(26px, 5.5vw, 36px)' : 'clamp(22px, 4.5vw, 30px)',
            height: spinning ? 'clamp(26px, 5.5vw, 36px)' : 'clamp(22px, 4.5vw, 30px)',
            background: 'radial-gradient(circle, #ffffff, #8b5cf6 40%, #3b82f6)',
            borderRadius: '50%',
            boxShadow: spinning 
              ? '0 0 70px rgba(139, 92, 246, 1), 0 0 100px rgba(59, 130, 246, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.8)'
              : '0 0 45px rgba(139, 92, 246, 1), 0 0 60px rgba(59, 130, 246, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.6)',
            animation: spinning ? 'pulse 0.8s ease-in-out infinite' : 'none',
            transition: 'all 0.3s ease',
            border: '3px solid rgba(255, 255, 255, 0.5)'
          }} />
        </div>

        <div style={{ position: 'relative', height: '100%' }}>
          {extendedItems.map(({ data, idx }) => {
            const itemCenter = idx * ITEM_WIDTH;
            // Используем плавный offset без округления для более естественного движения
            const distance = Math.abs(itemCenter - visualOffset);

            if (distance > ITEM_WIDTH * 3.5) {
              return null;
            }

            // Более плавное определение центра
            const isCenter = distance < 20;
            const translateX = itemCenter - visualOffset;
            // Горизонтальная рулетка без вертикального смещения
            const translateY = 0;
            // Более плавное масштабирование
            const scale = isCenter ? 1.4 : Math.max(0.55, 1 - (distance / (ITEM_WIDTH * 2.3)));
            // Более плавная прозрачность
            const opacity = isCenter ? 1 : Math.max(0.2, 1 - (distance / (ITEM_WIDTH * 1.5)));
            // Плавное размытие
            const blur = isCenter ? 0 : Math.min(3, distance / 100);

            return (
              <div
                key={`${data.id}-${idx}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                  opacity,
                  filter: `blur(${blur}px) brightness(${isCenter ? 1.1 : 0.85})`,
                  transition: 'none',
                  pointerEvents: 'none'
                }}
              >
                <div style={{
                  width: 'clamp(140px, 22vw, 170px)',
                  height: 'clamp(140px, 22vw, 170px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'clamp(18px, 3.5vw, 24px)',
                  padding: 'clamp(12px, 2.5vw, 16px)',
                  background: isCenter
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(59, 130, 246, 0.25))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
                  border: isCenter
                    ? '3px solid rgba(139, 92, 246, 0.7)'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isCenter
                    ? '0 20px 60px rgba(139, 92, 246, 0.6), inset 0 0 50px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.4)'
                    : '0 8px 20px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(15px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Glow effect for center item */}
                  {isCenter && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3), transparent 70%)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                  )}
                  {data.data ? (
                    <Lottie
                      animationData={data.data}
                      loop
                      autoplay
                      style={{
                        width: isCenter ? 'clamp(100px, 16vw, 120px)' : 'clamp(80px, 13vw, 100px)',
                        height: isCenter ? 'clamp(100px, 16vw, 120px)' : 'clamp(80px, 13vw, 100px)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: isCenter ? 'clamp(70px, 11vw, 88px)' : 'clamp(55px, 9vw, 70px)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {data.emoji || '🎁'}
                    </div>
                  )}
                  <div style={{
                    marginTop: isCenter ? 'clamp(6px, 1.5vw, 10px)' : 'clamp(4px, 1vw, 6px)',
                    fontWeight: 700,
                    fontSize: isCenter ? 'clamp(0.85rem, 2vw, 1.05rem)' : 'clamp(0.7rem, 1.5vw, 0.82rem)',
                    color: 'white',
                    textShadow: isCenter 
                      ? '0 4px 15px rgba(139, 92, 246, 0.8), 0 2px 6px rgba(0,0,0,0.8)'
                      : '0 2px 8px rgba(0,0,0,0.7)',
                    opacity: isCenter ? 1 : 0.75,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {data.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier selection buttons */}
      <div style={{
        display: 'flex',
        gap: 'clamp(0.5rem, 2vw, 1rem)',
        marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '900px',
        willChange: 'auto'
      }}>
        {Object.entries(TIER_CONFIG).map(([key, config]) => {
          const isSelected = selectedTier === key;
          
          // Определяем текст для каждой кнопки
          const tierText = key === 'basic' ? '1X ШАНС' : key === 'premium' ? '10X ШАНС' : '100X ШАНС';
          
          return (
            <button
              key={`tier-button-${key}`}
              onClick={() => handleTierChange(key)}
              disabled={spinning || isTransitioning}
              style={{
                flex: '1 1 clamp(180px, 28%, 280px)',
                minHeight: 'clamp(100px, 15vw, 130px)',
                padding: 'clamp(12px, 3vw, 18px)',
                fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                fontWeight: 700,
                color: 'white',
                border: isSelected ? `3px solid ${config.color}` : '2px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'clamp(16px, 3vw, 22px)',
                cursor: (spinning || isTransitioning) ? 'not-allowed' : 'pointer',
                background: isSelected 
                  ? `linear-gradient(135deg, ${config.color}ee, ${config.color}cc)` 
                  : 'rgba(255, 255, 255, 0.04)',
                boxShadow: isSelected 
                  ? `0 12px 30px ${config.color}66, inset 0 1px 0 rgba(255, 255, 255, 0.25)` 
                  : '0 4px 12px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.25s ease-out',
                backdropFilter: 'blur(10px)',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                opacity: (spinning || isTransitioning) ? 0.5 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(6px, 1.5vw, 10px)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!spinning) {
                  e.currentTarget.style.transform = isSelected ? 'scale(1.03)' : 'scale(1.02)';
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!spinning) {
                  e.currentTarget.style.transform = isSelected ? 'scale(1.03)' : 'scale(1)';
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '200%',
                  height: '200%',
                  background: `radial-gradient(circle, ${config.color}33, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              )}
              <div style={{ 
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                position: 'relative',
                zIndex: 1
              }}>
                {config.icon}
              </div>
              <div 
                style={{
                  fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  position: 'relative',
                  zIndex: 1,
                  minHeight: '1.2em',
                  opacity: 1,
                  visibility: 'visible',
                  display: 'block'
                }}
              >
                <span style={{ opacity: 1, visibility: 'visible' }}>{tierText}</span>
              </div>
              <div style={{
                padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 18px)',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                position: 'relative',
                zIndex: 1,
                opacity: 1,
                visibility: 'visible'
              }}>
                <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', opacity: 0.85, visibility: 'visible' }}>
                  РАСКРУТИТЬ ЗА
                </span>
                <span style={{ opacity: 1, visibility: 'visible' }}>{config.price}</span>
                <span style={{ opacity: 1, visibility: 'visible' }}>⭐</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        style={{
          padding: 'clamp(14px, 3vw, 18px) clamp(32px, 8vw, 48px)',
          fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
          fontWeight: 700,
          color: 'white',
          border: 'none',
          borderRadius: '999px',
          cursor: 'pointer',
          background: spinning 
            ? 'linear-gradient(135deg, #f59e0b, #f97316)' 
            : `linear-gradient(135deg, ${tierConfig.color}, ${tierConfig.color}dd)`,
          boxShadow: spinning
            ? '0 8px 20px rgba(245, 158, 11, 0.5), 0 0 30px rgba(249, 115, 22, 0.4)'
            : `0 15px 40px ${tierConfig.color}66, 0 5px 15px ${tierConfig.color}44`,
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          opacity: 1
        }}
        onMouseEnter={(e) => {
          if (!spinning) {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 20px 50px ${tierConfig.color}88, 0 8px 20px ${tierConfig.color}55`;
          }
        }}
        onMouseLeave={(e) => {
          if (!spinning) {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = `0 15px 40px ${tierConfig.color}66, 0 5px 15px ${tierConfig.color}44`;
          }
        }}
      >
        <span style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center',
          flexDirection: 'row'
        }}>
          {spinning ? '⚡ Крутится...' : `🎲 Крутить колесо! (${tierConfig.icon} ${tierConfig.price})`}
        </span>
        {!spinning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent)',
            opacity: 0.5
          }} />
        )}
      </button>

      {/* Result modal */}
      {showResult && resultItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 12, 41, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.35s ease forwards',
            padding: 'clamp(0.75rem, 2.5vw, 1.5rem)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          onClick={closeResult}
        >
          <div
            style={{
              position: 'relative',
              width: 'min(95%, 420px)',
              maxHeight: '95vh',
              background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.95), rgba(48, 43, 99, 0.95))',
              borderRadius: 'clamp(18px, 3.5vw, 24px)',
              padding: 'clamp(20px, 4.5vw, 36px) clamp(16px, 3.5vw, 28px)',
              boxShadow: '0 40px 100px rgba(139, 92, 246, 0.4), 0 0 100px rgba(59, 130, 246, 0.3)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              textAlign: 'center',
              color: 'white',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${tierConfig.color}33, transparent 50%)`,
              pointerEvents: 'none'
            }} />
            
            {/* Prize animation */}
            <div
              className="result-gift"
              style={{
                width: 'clamp(160px, 30vw, 220px)',
                height: 'clamp(160px, 30vw, 220px)',
                margin: '0 auto clamp(12px, 3vw, 20px)',
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {resultItem.animation ? (
                <Lottie
                  animationData={resultItem.animation}
                  loop={true}
                  autoplay={true}
                  style={{
                    width: '100%',
                    height: '100%',
                    filter: 'drop-shadow(0 20px 50px rgba(139, 92, 246, 0.6))'
                  }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid meet',
                    progressiveLoad: true
                  }}
                />
              ) : (
                <div style={{
                  fontSize: 'clamp(80px, 15vw, 120px)',
                  textShadow: '0 20px 50px rgba(139, 92, 246, 0.7)'
                }}>
                  🎁
                </div>
              )}
            </div>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
              marginBottom: 'clamp(8px, 2vw, 12px)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              position: 'relative',
              zIndex: 1
            }}>
              Поздравляем! 🎉
            </h2>
            <p style={{
              fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
              opacity: 0.85,
              marginBottom: 'clamp(12px, 3vw, 16px)',
              position: 'relative',
              zIndex: 1
            }}>
              Вы выиграли:
            </p>
            <div
              style={{
                margin: 'clamp(14px, 3vw, 20px) auto clamp(20px, 4vw, 28px)',
                padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 22px)',
                borderRadius: 'clamp(14px, 3vw, 18px)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.25))',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                fontWeight: 700,
                fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                boxShadow: '0 15px 40px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                position: 'relative',
                zIndex: 1
              }}
            >
              {resultItem.name}
            </div>
            <button
              onClick={closeResult}
              style={{
                marginTop: 'clamp(8px, 2vw, 12px)',
                padding: 'clamp(10px, 2.5vw, 14px) clamp(24px, 6vw, 32px)',
                borderRadius: '999px',
                border: 'none',
                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
                boxShadow: '0 15px 35px rgba(139, 92, 246, 0.5)',
                transition: 'all 0.2s ease',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 45px rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.5)';
              }}
            >
              Закрыть ✨
            </button>
          </div>
        </div>
      )}

      {/* Info footer */}

      {/* All prizes section */}
      <div style={{
        marginTop: 'clamp(1.5rem, 4vw, 2.5rem)',
        marginBottom: 'clamp(1rem, 3vw, 2rem)',
        width: '100%',
        maxWidth: '1200px',
        position: 'relative',
        zIndex: 1,
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
        pointerEvents: isTransitioning ? 'none' : 'auto'
      }}>
        <h3 style={{
          color: `${tierConfig.color}`,
          fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
          backgroundImage: `linear-gradient(135deg, ${tierConfig.color}, #3b82f6)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          opacity: isTransitioning ? 0 : 1,
          visibility: 'visible',
          display: 'block',
          transition: 'opacity 0.3s ease-out'
        }}>
          {tierConfig.icon} {tierConfig.name} - Все доступные призы
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px, 20vw, 200px), 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1.25rem)',
          padding: 'clamp(0.75rem, 2.5vw, 1.25rem)',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'clamp(14px, 2.5vw, 18px)',
          border: `1px solid ${tierConfig.color}22`,
          backdropFilter: 'blur(10px)',
          maxHeight: '50vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}>
          {currentFilteredItems.map((item, index) => {            
            return (
            <div
              key={`prize-${selectedTier}-${item.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'clamp(1rem, 2.5vw, 1.3rem)',
                minHeight: 'clamp(140px, 25vw, 180px)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                borderRadius: 'clamp(12px, 2.5vw, 16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'visible'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.15))';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Prize number badge */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: '50%',
                width: 'clamp(24px, 4vw, 28px)',
                height: 'clamp(24px, 4vw, 28px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
                fontWeight: 700,
                color: 'white',
                border: '1px solid rgba(139, 92, 246, 0.5)'
              }}>
                {index + 1}
              </div>

              {/* Показываем статичные анимации (без автоплея) или эмодзи */}
              {item.data ? (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  marginBottom: 'clamp(0.5rem, 1.5vw, 0.8rem)'
                }}>
                  <Lottie
                    animationData={item.data}
                    loop={false}
                    autoplay={false}
                    style={{
                      width: 'clamp(80px, 15vw, 100px)',
                      height: 'clamp(80px, 15vw, 100px)',
                      pointerEvents: 'none'
                    }}
                    rendererSettings={{
                      preserveAspectRatio: 'xMidYMid meet'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  fontSize: 'clamp(50px, 10vw, 65px)',
                  marginBottom: 'clamp(0.5rem, 1.5vw, 0.8rem)',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.emoji || '🎁'}
                </div>
              )}
              
              <div style={{
                fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                fontWeight: 600,
                color: 'white',
                textAlign: 'center',
                wordBreak: 'break-word',
                lineHeight: 1.3,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {item.name}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.85;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes dropGift {
          0% {
            transform: translateY(-250px) scale(0.5) rotate(-15deg);
            opacity: 0;
          }
          60% {
            transform: translateY(20px) scale(1.2) rotate(5deg);
            opacity: 1;
          }
          80% {
            transform: translateY(-10px) scale(0.95) rotate(-2deg);
          }
          100% {
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        .result-gift {
          animation: dropGift 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          body {
            touch-action: pan-y;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Дополнительная оптимизация скролла для призов */
          [style*="overflowY: auto"] {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        }
        
        /* Адаптация под очень маленькие экраны */
        @media (max-width: 360px) {
          h1 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleWheel;
