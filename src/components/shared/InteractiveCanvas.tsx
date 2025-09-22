import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, Eraser, RotateCcw, Download } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

const InteractiveCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#8B5A3C");
  const [brushSize, setBrushSize] = useState(5);
  const [isErasing, setIsErasing] = useState(false);

  const colors = [
    "#8B5A3C", // Brown (wood)
    "#D2691E", // Saddle Brown
    "#A0522D", // Sienna
    "#CD853F", // Peru
    "#DEB887", // Burlywood
    "#F4A460", // Sandy Brown
    "#696969", // Gray
    "#2F4F4F", // Dark Slate Gray
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a simple floor pattern as starting point
    ctx.strokeStyle = "#e9ecef";
    ctx.lineWidth = 1;
    
    // Draw grid pattern
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.fill();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw grid
    ctx.strokeStyle = "#e9ecef";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "floor-design.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-navy mb-2">Design Your Floor</h3>
        <p className="text-grey text-sm">
          Use the tools below to sketch your floor design ideas. Choose colors and experiment with patterns!
        </p>
      </div>

      {/* Tools */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        {/* Color Palette */}
        <div className="flex gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                setCurrentColor(color);
                setIsErasing(false);
              }}
              className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                currentColor === color && !isErasing ? "border-navy" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-grey">Size:</span>
          <input
            type="range"
            min="2"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16"
          />
        </div>

        {/* Tools */}
        <div className="flex gap-2">
          <Button
            variant={isErasing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsErasing(!isErasing)}
            className="flex items-center gap-1"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={downloadCanvas}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full h-64 sm:h-80 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousedown", {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            startDrawing(mouseEvent as any);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousemove", {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            draw(mouseEvent as any);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
        />
      </div>

      <p className="text-xs text-grey mt-3 text-center">
        Draw your ideas and download your design. Share it with us for a custom quote!
      </p>
    </Card>
  );
};

export default InteractiveCanvas;