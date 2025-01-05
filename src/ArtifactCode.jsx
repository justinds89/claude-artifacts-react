import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Plus, Trash2, Upload, Play, Filter, Settings } from 'lucide-react';
import Papa from 'papaparse';

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const particlesRef = useRef([]);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }, [dimensions]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffffff'];

    particlesRef.current = [];
    const particlesPerBurst = 150;
    const burstPoints = [
      { x: dimensions.width * 0.3, y: dimensions.height * 0.4 },
      { x: dimensions.width * 0.7, y: dimensions.height * 0.4 },
      { x: dimensions.width * 0.5, y: dimensions.height * 0.3 }
    ];

    burstPoints.forEach(point => {
      for (let i = 0; i < particlesPerBurst; i++) {
        const angle = (Math.PI * 2 * i) / particlesPerBurst;
        const velocity = 8 + Math.random() * 4;
        particlesRef.current.push({
          x: point.x,
          y: point.y,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: Math.cos(angle) * velocity * (Math.random() + 0.5),
          speedY: Math.sin(angle) * velocity * (Math.random() + 0.5),
          gravity: 0.15,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
          opacity: 1
        });
      }
    });

    const animate = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.speedY += particle.gravity;
        particle.rotation += particle.rotationSpeed;
        particle.opacity -= 0.005;

        if (particle.opacity <= 0) return false;

        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();

        return particle.opacity > 0;
      });

      if (particlesRef.current.length > 0) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [active, dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

function PrizeDraw() {
  const [isPresentation, setIsPresentation] = useState(false);
  const [currentNames, setCurrentNames] = useState([]);
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [error, setError] = useState('');
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [newDrawingName, setNewDrawingName] = useState('');
  const [winner, setWinner] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnNames, setDrawnNames] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMasterResetWarning, setShowMasterResetWarning] = useState(false);
  const [showDeleteDrawingWarning, setShowDeleteDrawingWarning] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError('Error parsing CSV file');
            return;
          }
          setCsvColumns(results.meta.fields);
          setCsvData(results.data);
        },
        error: () => {
          setError('Error reading CSV file');
        }
      });
    };
    reader.readAsText(file);
  };

  const handleMasterReset = () => {
    setCsvData(null);
    setCsvColumns([]);
    setDrawings([]);
    setSelectedDrawing(null);
    setCurrentNames([]);
    setDrawnNames({});
    setNewDrawingName('');
    setWinner('');
    setError('');
  };

  const handleDeleteDrawing = (drawingId) => {
    setDrawings(drawings.filter(d => d.id !== drawingId));
    if (selectedDrawing === drawingId) {
      setSelectedDrawing(null);
    }
    const newDrawnNames = { ...drawnNames };
    delete newDrawnNames[drawingId];
    setDrawnNames(newDrawnNames);
  };

  if (isPresentation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white p-8">
        <Confetti active={showConfetti} />
        
        <div className="absolute top-4 left-4 flex space-x-4 items-center">
          <Button
            variant="outline"
            onClick={() => setIsPresentation(false)}
            className="text-gray-300 border-gray-300 hover:text-white hover:border-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Back to Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Prize Drawing Setup</h2>
        <div className="space-x-4">
          <Button
            onClick={() => setIsPresentation(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Enter Presentation Mode
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowMasterResetWarning(true)}
            className="text-red-500 hover:text-red-700"
          >
            Reset Everything
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Upload Section */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Upload Participant Data</h2>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="flex-1"
            />
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </CardContent>
        </Card>

        {/* Create Drawing Section */}
        {csvData && (
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <Input
                  type="text"
                  value={newDrawingName}
                  onChange={(e) => setNewDrawingName(e.target.value)}
                  placeholder="Enter drawing name (e.g., District A Drawing)"
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    if (newDrawingName.trim()) {
                      setDrawings([...drawings, {
                        id: Date.now(),
                        name: newDrawingName,
                        filters: {},
                        participants: []
                      }]);
                      setNewDrawingName('');
                    }
                  }}
                  disabled={!newDrawingName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Drawing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drawings List */}
        {drawings.map(drawing => (
          <Card key={drawing.id} className="bg-white shadow-lg">
            <CardContent className="p-6 min-h-[100px] flex items-center">
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-bold">{drawing.name}</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDrawing(selectedDrawing === drawing.id ? null : drawing.id)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button
                    onClick={() => handleDeleteDrawing(drawing.id)}
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentNames(drawing.participants);
                      setSelectedDrawing(drawing.id);
                      setIsPresentation(true);
                    }}
                    disabled={!drawing.participants?.length}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Drawing ({drawing.participants?.length || 0})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PrizeDraw;
