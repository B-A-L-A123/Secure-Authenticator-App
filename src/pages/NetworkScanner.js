import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

// Use environment variable or fallback to localhost:3001
const API_URL = 'http://localhost:3001';

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
  const filteredResults = showClosed ? results : results.filter((result) => result.status === 'open');

  const openCount = results.filter((r) => r.status === 'open').length;
  const closedCount = results.filter((r) => r.status === 'closed').length;

  return (
    <ScrollView className="flex-1 bg-[#213448] p-6">
      <View className="max-w-4xl mx-auto w-full">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-[#EAE0CF] mb-2">Network Scanner</Text>
          <Text className="text-sm text-[#94B4C1]">
            Connected to: <Text className="bg-[#547792] px-2 py-1 rounded">{API_URL}</Text>
          </Text>
        </View>

        <View className="bg-[#547792] rounded-lg p-6 mb-6 border border-[#94B4C1]/20">
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#EAE0CF] mb-2">IP Range</Text>
            <TextInput
              value={ips}
              onChangeText={setIps}
              placeholder="192.168.1.1-192.168.1.50"
              placeholderTextColor="#94B4C1"
              className="w-full px-4 py-2 bg-[#213448] text-[#EAE0CF] rounded-lg border border-[#94B4C1]/20"
              editable={!scanning}
            />
            <Text className="text-xs text-[#94B4C1] mt-1">
              Format: 192.168.1.1-192.168.1.50 or 192.168.1.0/24 (Smaller ranges = faster)
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-[#EAE0CF] mb-2">Ports (comma-separated)</Text>
            <TextInput
              value={ports}
              onChangeText={setPorts}
              placeholder="80,443,22"
              placeholderTextColor="#94B4C1"
              className="w-full px-4 py-2 bg-[#213448] text-[#EAE0CF] rounded-lg border border-[#94B4C1]/20"
              editable={!scanning}
            />
            <Text className="text-xs text-[#94B4C1] mt-1">
              Common: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 8080 (Alt HTTP)
            </Text>
          </View>

          <TouchableOpacity
            onPress={startScan}
            disabled={scanning}
            className={`w-full py-3 rounded-lg ${
              scanning ? 'bg-[#94B4C1]/40' : 'bg-blue-600'
            }`}
          >
            {scanning ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#EAE0CF" size="small" />
                <Text className="ml-3 text-[#EAE0CF] font-medium">Scanning...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-medium">Start Scan</Text>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <Text className="text-red-800 mr-2">⚠️</Text>
              <View className="flex-1">
                <Text className="text-red-800 font-semibold">Error:</Text>
                <Text className="text-red-800 mt-1">{error}</Text>
                <Text className="text-red-800 text-sm mt-2">
                  Make sure the backend server is running on {API_URL}
                </Text>
              </View>
            </View>
          </View>
        )}

        {scanning && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-center">
              <ActivityIndicator color="#1e40af" size="small" />
              <Text className="ml-2 text-blue-800">
                Scanning network... This may take a while depending on the range.
              </Text>
            </View>
          </View>
        )}

        {results.length > 0 && (
          <View className="bg-[#547792] rounded-lg p-6 border border-[#94B4C1]/20">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xl font-bold text-[#EAE0CF]">Scan Results</Text>
                <Text className="text-sm text-[#94B4C1] mt-1">
                  <Text className="text-green-600 font-semibold">{openCount} open</Text>
                  {' • '}
                  <Text className="text-red-600">{closedCount} closed</Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowClosed(!showClosed)}
                className="flex-row items-center"
              >
                <View
                  className={`w-4 h-4 rounded mr-2 ${
                    showClosed ? 'bg-blue-600' : 'bg-[#213448]'
                  } border border-[#94B4C1]/20`}
                >
                  {showClosed && <Text className="text-white text-xs text-center">✓</Text>}
                </View>
                <Text className="text-sm font-medium text-[#EAE0CF]">Show closed ports</Text>
              </TouchableOpacity>
            </View>

            {filteredResults.length > 0 ? (
              <ScrollView className="max-h-96">
                {filteredResults.map((result, index) => (
                  <View
                    key={index}
                    className="p-3 bg-[#213448]/50 rounded border border-[#94B4C1]/10 mb-2"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="font-mono text-sm text-[#EAE0CF]">
                        {result.ip}:{result.port}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded ${
                          result.status === 'open'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            result.status === 'open'
                              ? 'text-green-800'
                              : 'text-red-800'
                          }`}
                        >
                          {result.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <Text className="text-lg font-medium text-[#94B4C1]">No open ports found</Text>
                <Text className="text-sm text-[#94B4C1] mt-2">
                  Try scanning a different range or check "Show closed ports"
                </Text>
              </View>
            )}
          </View>
        )}

        {!scanning && !error && results.length === 0 && (
          <View className="bg-[#547792] border border-[#94B4C1]/20 rounded-lg p-8 items-center">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-lg font-medium text-[#EAE0CF]">No scan results yet</Text>
            <Text className="text-sm text-[#94B4C1] mt-2">
              Configure your scan parameters and click "Start Scan"
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
