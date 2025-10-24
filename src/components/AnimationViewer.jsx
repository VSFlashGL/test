import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const AnimationViewer = () => {
  const [selectedFile, setSelectedFile] = useState(30);
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/animations/${String(selectedFile).padStart(2, '0')}_emoji.json`);
        if (!response.ok) {
          throw new Error('Failed to load animation');
        }
        
        const data = await response.json();
        setAnimationData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading animation:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadAnimation();
  }, [selectedFile]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '2rem' }}>
        🎨 Просмотр Анимаций
      </h1>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        {loading && (
          <div style={{ 
            width: '300px', 
            height: '300px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem'
          }}>
            Загрузка...
          </div>
        )}
        
        {error && (
          <div style={{ 
            width: '300px', 
            height: '300px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem'
          }}>
            ❌ Ошибка: {error}
          </div>
        )}
        
        {!loading && !error && animationData && (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '300px', height: '300px' }}
          />
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '1.5rem',
        marginBottom: '1rem'
      }}>
        <label style={{ color: 'white', fontSize: '1.2rem', marginRight: '1rem' }}>
          Выберите анимацию (1-51):
        </label>
        <input
          type="number"
          min="1"
          max="51"
          value={selectedFile}
          onChange={(e) => setSelectedFile(parseInt(e.target.value))}
          style={{
            padding: '10px 20px',
            fontSize: '1.1rem',
            borderRadius: '10px',
            border: 'none',
            width: '100px',
            textAlign: 'center'
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
        gap: '10px',
        maxWidth: '800px',
        width: '100%'
      }}>
        {Array.from({ length: 51 }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => setSelectedFile(num)}
            style={{
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              background: selectedFile === num 
                ? 'linear-gradient(to right, #4ade80, #3b82f6)'
                : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (selectedFile !== num) {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile !== num) {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnimationViewer;
