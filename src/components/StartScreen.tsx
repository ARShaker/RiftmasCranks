import React, { useEffect, useState, useCallback, useRef } from 'react';

interface StartScreenProps {
  onStart: () => void;
}

interface FlyingImage {
  id: number;
  src: string;
  x: number;
  y: number;
  startTime: number;
}

// All title images
const titleImages = [
  '72875411894__C63398DA-7D0C-4D0F-968B-D79BEFD20034.png',
  'DSCF0024.jpeg',
  'Dave_green_monster.png',
  'IMG_0774.png',
  'IMG_0843.jpeg',
  'IMG_1387.JPG',
  'IMG_1409.PNG',
  'IMG_1441.JPG',
  'IMG_1474.JPG',
  'IMG_1483.PNG',
  'IMG_1669.JPG',
  'IMG_1678.JPG',
  'IMG_1744.JPG',
  'IMG_1751.JPG',
  'IMG_1755.JPG',
  'IMG_1756.JPG',
  'IMG_1778.PNG',
  'IMG_2041.JPG',
  'IMG_2643.JPG',
  'IMG_6177.JPG',
  'IMG_6199.JPG',
  'IMG_6726.JPG',
  'IMG_7060.png',
  'IMG_7061.png',
  'IMG_7062.png',
  'IMG_7063.png',
  'IMG_7068.png',
  'IMG_7269.png',
  'IMG_7504.png',
  'IMG_7507.JPG',
  'IMG_7555.png',
  'Screenshot 2025-02-13 at 11.35.56 PM.png',
  'dave_most_improved_award.jpg',
  'dave_osha_certified.jpg',
  'dave_taric_award.jpg',
  'dygs_loot_goblin_v2.jpg',
  'dygs_yard_sale_specialist.jpg',
  'gumby-award.jpg',
  'jamie_04-05_spurs_award.jpg',
  'jamie_vibemaster_general.jpg',
  'jamie_voice_chat_comedian.png',
  'mack_anti_meta_savant.jpg',
  'mack_bong_bomber.jpg',
  'oliver_Flash_blurred.png',
  'oliver_boombox_award.jpg',
  'shaker_benchwarmers.png',
  'shaker_micro_play_award.jpg',
  'slopeside.jpg',
  'the-optimist.jpg',
  'tommy_apres_ski_superstar.png',
  'tommy_kill_steal.png',
  'tommy_pizza_delivery_boy.jpg',
  'van_best_dressed.jpg',
  'van_unfazed.png',
  'will_macro_play_award.jpg',
  'will_wifi_warrior.jpg',
];

// Generate rainbow color based on time offset
const getRainbowColor = (t: number): string => {
  const r = Math.sin(t) * 127 + 128;
  const g = Math.sin(t + 2) * 127 + 128;
  const b = Math.sin(t + 4) * 127 + 128;
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
};

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [scale, setScale] = useState(1);
  const [growing, setGrowing] = useState(true);
  const [showPrompt, setShowPrompt] = useState(true);
  const [time, setTime] = useState(0);
  const [flyingImages, setFlyingImages] = useState<FlyingImage[]>([]);
  const idCounterRef = useRef(0);

  const titleText = 'Riftmas Crankerz';

  // Spawn flying images at intervals
  useEffect(() => {
    const spawnImage = () => {
      const randomIndex = Math.floor(Math.random() * titleImages.length);
      const src = titleImages[randomIndex];

      const newImage: FlyingImage = {
        id: idCounterRef.current++,
        src: `assets/title_images/${src}`,
        x: 50 + (Math.random() - 0.5) * 60, // 20-80% of screen width
        y: 50 + (Math.random() - 0.5) * 40, // 30-70% of screen height
        startTime: Date.now(),
      };

      setFlyingImages((prev) => [...prev, newImage]);

      // Remove after animation completes
      setTimeout(() => {
        setFlyingImages((prev) => prev.filter((img) => img.id !== newImage.id));
      }, 5000);
    };

    const interval = setInterval(spawnImage, 2500);
    return () => clearInterval(interval);
  }, []);

  // Animate time for rainbow and wave effects (slower)
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 0.05);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Animate title scale (pulsing effect - slower)
  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prevScale) => {
        if (growing) {
          if (prevScale >= 1.08) {
            setGrowing(false);
            return prevScale - 0.002;
          }
          return prevScale + 0.002;
        } else {
          if (prevScale <= 0.96) {
            setGrowing(true);
            return prevScale + 0.002;
          }
          return prevScale - 0.002;
        }
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [growing]);

  // Blink the prompt text
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPrompt((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Handle any key press or click
  const handleStart = useCallback(() => {
    onStart();
  }, [onStart]);

  // Listen for keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for space to avoid scrolling
      if (e.code === 'Space') {
        e.preventDefault();
      }
      handleStart();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart]);

  return (
    <>
      <style>
        {`
          @keyframes flyTowardsCamera {
            0% {
              width: 3vw;
              opacity: 0.9;
            }
            100% {
              width: 66vw;
              opacity: 0;
            }
          }
        `}
      </style>
      <div
        onClick={handleStart}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#1a1a2e',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Flying images layer */}
        {flyingImages.map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt=""
            style={{
              position: 'absolute',
              left: `${img.x}%`,
              top: `${img.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'flyTowardsCamera 5s ease-in forwards',
              zIndex: 0,
              width: '3vw',
              height: 'auto',
            }}
          />
        ))}
        <div
          style={{
            fontSize: 'clamp(24px, 5vw, 48px)',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontWeight: 'bold',
            textAlign: 'center',
            transform: `scale(${scale})`,
            marginBottom: '60px',
            display: 'flex',
            justifyContent: 'center',
            imageRendering: 'pixelated',
            zIndex: 1,
            position: 'relative',
          }}
        >
          {titleText.split('').map((char, index) => {
            const colorOffset = time + index * 0.3;
            const waveOffset = Math.sin(time + index * 0.4) * 8;
            const color = getRainbowColor(colorOffset);

            return (
              <span
                key={index}
                style={{
                  color: color,
                  transform: `translateY(${waveOffset}px)`,
                  display: 'inline-block',
                  transition: 'transform 0.05s linear',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>

        <p
          style={{
            color: '#fff',
            fontSize: 'clamp(8px, 1.5vw, 14px)',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            opacity: showPrompt ? 1 : 0,
            transition: 'opacity 0.1s ease-in-out',
            zIndex: 1,
            position: 'relative',
          }}
        >
          Press Any Button to Start
        </p>
      </div>
    </>
  );
};
