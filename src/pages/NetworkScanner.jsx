import { useState } from 'react';

// Use environment variable or fallback to localhost:3001
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function NetworkScanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [ips, setIps] = useState('192.168.1.1-192.168.1.50');
  const [ports, setPorts] = useState('80,443,22');
  const [showClosed, setShowClosed] = useState(false);

  const startScan = async () => {
    setScanning(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`${API_URL}/api/scan/network`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ips, ports }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  // Filter results based on showClosed toggle
  const filteredResults = showClosed 
    ? results 
    : results.filter(result => result.status === 'open');

  const openCount = results.filter(r => r.status === 'open').length;
  const closedCount = results.filter(r => r.status === 'closed').length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Network Scanner</h1>
        <p className="text-sm text-gray-600">
          Connected to: <code className="bg-gray-100 px-2 py-1 rounded">{API_URL}</code>
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            IP Range
          </label>
          <input
            type="text"
            value={ips}
            onChange={(e) => setIps(e.target.value)}
            placeholder="192.168.1.1-192.168.1.50"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={scanning}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: 192.168.1.1-192.168.1.50 or 192.168.1.0/24 (Smaller ranges = faster)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Ports (comma-separated)
          </label>
          <input
            type="text"
            value={ports}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="80,443,22"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={scanning}
          />
          <p className="text-xs text-gray-500 mt-1">
            Common: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 8080 (Alt HTTP)
          </p>
        </div>

        <button
          onClick={startScan}
          disabled={scanning}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {scanning ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </span>
          ) : 'Start Scan'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <strong className="font-semibold">Error:</strong>
              <p className="mt-1">{error}</p>
              <p className="text-sm mt-2">
                Make sure the backend server is running on <code className="bg-red-100 px-1 rounded">{API_URL}</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {scanning && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6">
          <p className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scanning network... This may take a while depending on the range.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Scan Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                <span className="text-green-600 font-semibold">{openCount} open</span>
                {' • '}
                <span className="text-red-600">{closedCount} closed</span>
              </p>
            </div>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Show closed ports</span>
            </label>
          </div>

          {filteredResults.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm">{result.ip}:{result.port}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      result.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No open ports found</p>
              <p className="text-sm mt-2">Try scanning a different range or check "Show closed ports"</p>
            </div>
          )}
        </div>
      )}

      {!scanning && !error && results.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">No scan results yet</p>
          <p className="text-sm mt-2">Configure your scan parameters and click "Start Scan"</p>
        </div>
      )}
    </div>
  );
}