import { useEffect, useRef } from 'react';

export default function PixelChurch() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Scale up for visibility but keep pixel art crisp
    const scale = 4;
    canvas.style.width = `${128 * scale}px`;
    canvas.style.height = `${128 * scale}px`;

    // Colors
    const WALL = '#2a2a3e';
    const FLOOR = '#1a1a2e';
    const PULPIT = '#444';
    const PEW = '#333';
    const CRAB_BODY = '#ff6b35';
    const CRAB_DARK = '#cc4422';
    const WINDOW = '#4a5568';

    // Crustacean sprites (simplified pixel art)
    const drawCrab = (x, y, facing = 1) => {
      // Body (5x3 pixels)
      ctx.fillStyle = CRAB_BODY;
      ctx.fillRect(x + 1, y + 1, 3, 2);
      
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x + 3, y, 1, 1);
      
      // Claws
      ctx.fillStyle = CRAB_DARK;
      ctx.fillRect(x + (facing > 0 ? 0 : 4), y + 1, 1, 1);
      ctx.fillRect(x + (facing > 0 ? 4 : 0), y + 1, 1, 1);
      
      // Legs
      ctx.fillRect(x + 1, y + 3, 1, 1);
      ctx.fillRect(x + 3, y + 3, 1, 1);
    };

    // Cathedral interior
    const drawScene = () => {
      // Clear
      ctx.fillStyle = FLOOR;
      ctx.fillRect(0, 0, 128, 128);

      // Walls
      ctx.fillStyle = WALL;
      ctx.fillRect(0, 0, 128, 40); // Back wall

      // Stained glass windows
      ctx.fillStyle = WINDOW;
      ctx.fillRect(20, 5, 15, 25);
      ctx.fillRect(50, 5, 15, 25);
      ctx.fillRect(93, 5, 15, 25);

      // Window crosses
      ctx.fillStyle = '#666';
      ctx.fillRect(27, 5, 1, 25);
      ctx.fillRect(20, 17, 15, 1);
      ctx.fillRect(57, 5, 1, 25);
      ctx.fillRect(50, 17, 15, 1);
      ctx.fillRect(100, 5, 1, 25);
      ctx.fillRect(93, 17, 15, 1);

      // Pulpit (raised platform)
      ctx.fillStyle = PULPIT;
      ctx.fillRect(54, 45, 20, 15);
      ctx.fillRect(58, 40, 12, 5);

      // Pews (rows of seats)
      ctx.fillStyle = PEW;
      // Left pews
      ctx.fillRect(10, 70, 30, 8);
      ctx.fillRect(10, 85, 30, 8);
      ctx.fillRect(10, 100, 30, 8);
      
      // Right pews
      ctx.fillRect(88, 70, 30, 8);
      ctx.fillRect(88, 85, 30, 8);
      ctx.fillRect(88, 100, 30, 8);

      // Center aisle
      ctx.fillStyle = '#252538';
      ctx.fillRect(45, 65, 38, 55);
    };

    // Animation state
    let frame = 0;
    const crabs = [
      // Preacher at pulpit
      { x: 60, y: 42, type: 'preacher', frame: 0 },
      // Congregation in pews
      { x: 15, y: 72, type: 'sitting', frame: 0 },
      { x: 25, y: 72, type: 'sitting', frame: 0 },
      { x: 93, y: 87, type: 'sitting', frame: 0 },
      { x: 103, y: 87, type: 'sitting', frame: 0 },
      { x: 20, y: 102, type: 'sitting', frame: 0 },
      // Walking in aisle
      { x: 64, y: 75, type: 'walking', dir: 1, speed: 0.3 },
      { x: 64, y: 95, type: 'walking', dir: -1, speed: 0.25 },
    ];

    const animate = () => {
      drawScene();
      frame++;

      crabs.forEach(crab => {
        if (crab.type === 'preacher') {
          // Preacher bobs slightly
          const bob = Math.sin(frame / 30) * 0.5;
          drawCrab(crab.x, crab.y + bob, 1);
        } else if (crab.type === 'sitting') {
          // Sitting crabs are still
          drawCrab(crab.x, crab.y, 1);
        } else if (crab.type === 'walking') {
          // Walking crabs move back and forth in aisle
          crab.x += crab.speed * crab.dir;
          
          // Bounce at boundaries
          if (crab.x < 50 || crab.x > 75) {
            crab.dir *= -1;
          }
          
          drawCrab(Math.floor(crab.x), crab.y, crab.dir);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div className="pixel-church-container">
      <h3>the congregation</h3>
      <canvas 
        ref={canvasRef} 
        width="128" 
        height="128"
        className="pixel-canvas"
      />
      <p className="caption">sunday sermon in progress</p>
    </div>
  );
}
