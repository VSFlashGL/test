import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const WheelItemJSON = ({ item }) => {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadJSON = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(item.jsonUrl);
        if (!response.ok) {
          throw new Error('Failed to load JSON');
        }
        
        const data = await response.json();
        setAnimationData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading JSON animation:', err);
        setError(true);
        setLoading(false);
      }
    };

    if (item.jsonUrl) {
      loadJSON();
    }
  }, [item.jsonUrl]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        width: '100%'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error || !animationData) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        width: '100%',
        fontSize: '48px'
      }}>
        {item.fallback || '🎁'}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      width: '100%'
    }}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet'
        }}
        style={{ width: '120px', height: '120px' }}
      />
    </div>
  );
};

export default WheelItemJSON;
