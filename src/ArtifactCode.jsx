import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Plus, Trash2, Upload, Play, Filter, Settings } from 'lucide-react';
import Papa from 'papaparse';

function PrizeDraw() {
  // State definitions
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

  // File handling
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

  // Drawing functions
  const drawWinner = () => {
    if (!selectedDrawing) return;
    
    const currentDrawnNames = drawnNames[selectedDrawing] || [];
    const availableNames = currentNames.filter(name => !currentDrawnNames.includes(name));
    
    if (availableNames.length === 0) {
      setWinner('All names have been drawn!');
      return;
    }

    setIsDrawing(true);
    setShowConfetti(false);
    let shuffleCount = 0;
    const maxShuffles = 20;

    const shuffleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      setWinner(availableNames[randomIndex]);
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        setIsDrawing(false);
        const finalWinner = availableNames[Math.floor(Math.random() * availableNames.length)];
        setWinner(finalWinner);
        setDrawnNames({
          ...drawnNames,
          [selectedDrawing]: [...currentDrawnNames, finalWinner]
        });
        setShowConfetti(true);
      }
    }, 100);
  };

  // Reset functions
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
    setShowMasterResetWarning(false);
  };

  const handleDeleteDrawing = (drawingId) => {
    setDrawings(drawings.filter(d => d.id !== drawingId));
    if (selectedDrawing === drawingId) {
      setSelectedDrawing(null);
    }
    const newDrawnNames = { ...drawnNames };
    delete newDrawnNames[drawingId];
    setDrawnNames(newDrawnNames);
    setShowDeleteDrawingWarning(null);
  };

  // Setup Mode UI
  const setupContent = (
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
            <div className="space-y-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              {csvData && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Loaded {csvData.length} records with {csvColumns.length} columns
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="bg-gray-100 px-4 py-2">
                      <span className="font-medium">Data Preview (First 5 Rows)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {csvColumns.map((column) => (
                              <th
                                key={column}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {csvData.slice(0, 5).map((row, index) => (
                            <tr key={index}>
                              {csvColumns.map((column) => (
                                <td
                                  key={column}
                                  className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap"
                                >
                                  {row[column]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Drawing Section */}
        {csvData && (
          <Card className="bg-white shadow-lg">
            <CardContent className="py-4 px-6">
              <div className="flex space-x-4 items-center">
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
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
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
                    onClick={() => setShowDeleteDrawingWarning(drawing.id)}
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

              {selectedDrawing === drawing.id && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {csvColumns.map(column => (
                      <div key={column} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {column}
                        </label>
                        <Input
                          type="text"
                          placeholder={`Filter by ${column}...`}
                          value={drawing.filters?.[column] || ''}
                          onChange={(e) => {
                            const newFilters = {
                              ...drawing.filters,
                              [column]: e.target.value
                            };
                            
                            const nameColumn = csvColumns.find(col => 
                              col.toLowerCase().includes('name')
                            ) || csvColumns[0];
                            
                            const filteredParticipants = csvData.filter(row => {
                              return Object.entries(newFilters).every(([col, val]) => {
                                if (!val) return true;
                                return row[col]?.toString().toLowerCase().includes(val.toLowerCase());
                              });
                            }).map(row => row[nameColumn]).filter(Boolean);

                            setDrawings(drawings.map(d => 
                              d.id === drawing.id 
                                ? { ...d, filters: newFilters, participants: filteredParticipants }
                                : d
                            ));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Filtered participants: {drawing.participants?.length || 0}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning Modals */}
      {showMasterResetWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reset Everything?</h3>
            <p className="text-gray-600 mb-6">
              This will delete all drawings, participants, and history. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowMasterResetWarning(false)}
                className="text-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMasterReset}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Reset Everything
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDrawingWarning !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Drawing?</h3>
            <p className="text-gray-600 mb-6">
              This will delete this drawing and all its history. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDrawingWarning(null)}
                className="text-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteDrawing(showDeleteDrawingWarning)}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Delete Drawing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Presentation Mode UI
  const presentationContent = (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white p-8">
      <div className="absolute top-4 left-4 flex space-x-4 items-center">
        <Button
          variant="outline"
          onClick={() => setIsPresentation(false)}
          className="text-gray-300 border-gray-300 hover:text-white hover:border-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Back to Setup
        </Button>

        <Button
          onClick={() => {
            const newDrawnNames = { ...drawnNames };
            delete newDrawnNames[selectedDrawing];
            setDrawnNames(newDrawnNames);
            setWinner('');
            setShowConfetti(false);
          }}
          variant="outline"
          disabled={!drawnNames[selectedDrawing]?.length}
          className="text-gray-300 border-gray-300 hover:text-white hover:border-white disabled:text-gray-600 disabled:border-gray-600"
        >
          Reset Current Draw
        </Button>

        <select
          className="bg-transparent text-gray-300 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
          value={selectedDrawing || ''}
          onChange={(e) => {
            const drawingId = parseInt(e.target.value, 10);
            const drawing = drawings.find(d => d.id === drawingId);
            if (drawing) {
              setCurrentNames(drawing.participants);
              setSelectedDrawing(drawingId);
              setWinner('');
              setShowConfetti(false);
            }
          }}
        >
          <option value="" disabled className="text-gray-900">
            Select a Drawing
          </option>
          {drawings.map(drawing => (
            <option 
              key={drawing.id} 
              value={drawing.id}
              className="text-gray-900"
            >
              {drawing.name} ({drawing.participants.length} participants)
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col h-screen max-w-4xl mx-auto text-center">
        <div className="flex-grow flex items-center justify-center pt-20">
          <div 
            className={`transform transition-all duration-300 ${
              isDrawing 
                ? 'scale-100 opacity-100' 
                : showConfetti 
                  ? 'scale-150 opacity-100' 
                  : 'scale-100 opacity-100'
            }`}
          >
            {isDrawing ? (
              <div className="space-y-4">
                <div className="text-3xl font-bold text-white mb-4">
                  Drawing...
                </div>
                <div className="text-7xl font-bold text-white">
                  {winner}
                </div>
              </div>
            ) : winner && (
              <>
                <Trophy className="w-32 h-32 text-yellow-500 mx-auto mb-6" />
                <h1 className="text-7xl font-bold text-yellow-500 mb-4">
                  Winner!
                </h1>
                <div className="text-5xl font-bold mt-6">{winner}</div>
              </>
            )}
          </div>
        </div>

        <div className="pb-24 space-y-8">
          <div className="flex justify-center">
            <Button
              onClick={drawWinner}
              disabled={isDrawing || !currentNames.length || (drawnNames[selectedDrawing]?.length === currentNames.length)}
              className="bg-green-500 hover:bg-green-600 text-2xl py-8 px-24 rounded-xl w-96"
            >
              Draw Winner
            </Button>
          </div>

          <div className="text-xl">
            Winners drawn: {drawnNames[selectedDrawing]?.length || 0} / {currentNames.length}
          </div>
        </div>
      </div>
    </div>
  );

  return isPresentation ? presentationContent : setupContent;
}

export default PrizeDraw;
