import React, { useState, useRef, useEffect } from 'react';
import '../styles/AvatarEditor.css';

const AvatarEditor = ({ imageFile, onSave, onCancel }) => {
  const [image, setImage] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          // Center the image initially
          const container = containerRef.current;
          if (container) {
            const containerSize = 300; // Size of the preview area
            const imgAspect = img.width / img.height;
            let initialScale;
            
            if (imgAspect > 1) {
              // Landscape - fit height
              initialScale = containerSize / img.height;
            } else {
              // Portrait or square - fit width
              initialScale = containerSize / img.width;
            }
            
            setScale(initialScale);
            setPosition({
              x: (containerSize - img.width * initialScale) / 2,
              y: (containerSize - img.height * initialScale) / 2
            });
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 400; // Output size
    
    canvas.width = size;
    canvas.height = size;
    
    // Draw the image centered in the circular crop
    ctx.clearRect(0, 0, size, size);
    
    // Create circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Calculate scaling factor from preview to output
    const previewSize = 300;
    const scaleFactor = size / previewSize;
    
    // Draw image
    ctx.drawImage(
      image,
      position.x * scaleFactor,
      position.y * scaleFactor,
      image.width * scale * scaleFactor,
      image.height * scale * scaleFactor
    );
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      const file = new File([blob], imageFile.name, {
        type: 'image/png',
        lastModified: Date.now()
      });
      onSave(file);
    }, 'image/png');
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div className="avatar-editor-overlay">
      <div className="avatar-editor-modal">
        <h2>Position Your Avatar</h2>
        <p>Drag the image to position it within the circle</p>
        
        <div 
          className="avatar-editor-container"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {image && (
            <img
              ref={imageRef}
              src={image.src}
              alt="Preview"
              className="avatar-editor-image"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              draggable={false}
            />
          )}
          <div className="avatar-editor-circle-overlay" />
        </div>
        
        <div className="avatar-editor-controls">
          <label>
            Zoom:
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={handleScaleChange}
            />
          </label>
        </div>
        
        <div className="avatar-editor-actions">
          <button onClick={handleSave} className="btn-save">
            Save Avatar
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default AvatarEditor;
