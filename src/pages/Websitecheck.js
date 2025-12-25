import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

export default function WebsiteCheck() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanType, setScanType] = useState('deep'); // 'quick' or 'deep'

  // Security patterns for threat detection
  const SECURITY_PATTERNS = {
    KEYLOGGER: [
      /addEventListener\s*\(\s*['"]keydown['"]/gi,
      /addEventListener\s*\(\s*['"]keypress['"]/gi,
      /addEventListener\s*\(\s*['"]keyup['"]/gi,
      /onkeydown\s*=/gi,
      /onkeypress\s*=/gi,
      /onkeyup\s*=/gi,
      /document\.onkey/gi,
      /KeyboardEvent/gi,
      /captureKeys/gi,
      /logKeys/gi,
      /keystroke/gi,
    ],
    SPYWARE: [
      /fetch\s*\(\s*['"][^'"]*track/gi,
      /XMLHttpRequest/gi,
      /navigator\.geolocation/gi,
      /getUserMedia/gi,
      /screen\.width/gi,
      /screen\.height/gi,
      /navigator\.userAgent/gi,
      /localStorage\.setItem/gi,
      /sessionStorage\.setItem/gi,
      /document\.cookie/gi,
      /track(ing|er|Event)/gi,
      /analytics/gi,
      /pixel/gi,
    ],
    MALICIOUS: [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /exec\s*\(/gi,
      /innerHTML\s*=/gi,
      /document\.write/gi,
      /fromCharCode/gi,
      /atob\s*\(/gi,
      /btoa\s*\(/gi,
      /unescape/gi,
      /\.createElement\s*\(\s*['"]script['"]/gi,
    ],
  };

  // Deep scan - fetches actual website content
  const deepScanWebsite = async (urlString) => {
    const threats = [];
    let risk = 'Low Risk';
    let recommendation = '';
    let details = '';

    try {
      const urlAnalysis = analyzeURL(urlString);
      threats.push(...urlAnalysis.threats);

      let htmlContent = '';
      let fetchSuccess = false;

      try {
        const response = await fetch(urlString, {
          method: 'GET',
        });

        if (response.ok) {
          htmlContent = await response.text();
          fetchSuccess = true;
        }
      } catch (fetchError) {
        threats.push('Unable to fetch website content due to CORS restrictions');
        details = 'Deep scan limited: Cannot access website content directly. Using URL-based analysis only.';
      }

      if (fetchSuccess && htmlContent) {
        let keyloggerScore = 0;
        SECURITY_PATTERNS.KEYLOGGER.forEach((pattern) => {
          const matches = htmlContent.match(pattern);
          if (matches) {
            keyloggerScore += matches.length;
          }
        });

        if (keyloggerScore > 5) {
          threats.push(`⚠️ HIGH ALERT: Detected ${keyloggerScore} keyboard event listeners - possible keylogger`);
          risk = 'Critical Risk';
        } else if (keyloggerScore > 2) {
          threats.push(`Detected ${keyloggerScore} keyboard event listeners - monitor for suspicious behavior`);
          if (risk === 'Low Risk') risk = 'Moderate Risk';
        }

        let spywareScore = 0;
        SECURITY_PATTERNS.SPYWARE.forEach((pattern) => {
          const matches = htmlContent.match(pattern);
          if (matches) {
            spywareScore += matches.length;
          }
        });

        if (spywareScore > 10) {
          threats.push(`⚠️ Detected ${spywareScore} tracking/data collection scripts - extensive monitoring detected`);
          if (risk === 'Low Risk') risk = 'High Risk';
        } else if (spywareScore > 5) {
          threats.push(`Detected ${spywareScore} tracking mechanisms - standard analytics or excessive tracking`);
          if (risk === 'Low Risk') risk = 'Moderate Risk';
        }

        let maliciousScore = 0;
        SECURITY_PATTERNS.MALICIOUS.forEach((pattern) => {
          const matches = htmlContent.match(pattern);
          if (matches) {
            maliciousScore += matches.length;
          }
        });

        if (maliciousScore > 15) {
          threats.push(`🚨 CRITICAL: Detected ${maliciousScore} potentially malicious script patterns`);
          risk = 'Critical Risk';
        } else if (maliciousScore > 8) {
          threats.push(`Detected ${maliciousScore} suspicious script patterns - may include obfuscated code`);
          if (risk !== 'Critical Risk') risk = 'High Risk';
        }

        const scriptTags = htmlContent.match(/<script[^>]*src\s*=\s*['"]([^'"]+)['"]/gi) || [];
        const externalScripts = scriptTags.length;

        if (externalScripts > 20) {
          threats.push(`Found ${externalScripts} external scripts - higher risk of third-party tracking`);
          if (risk === 'Low Risk') risk = 'Moderate Risk';
        }

        const suspiciousDomains = ['bit.ly', 'tinyurl', 'goo.gl', '.tk', '.ml', '.ga', '.cf', '.gq'];
        suspiciousDomains.forEach((domain) => {
          if (htmlContent.includes(domain)) {
            threats.push(`Links to suspicious short URL service or domain: ${domain}`);
            if (risk === 'Low Risk') risk = 'Moderate Risk';
          }
        });

        const formMatches = htmlContent.match(/<form[^>]*>/gi) || [];
        const passwordInputs = htmlContent.match(/type\s*=\s*['"]password['"]/gi) || [];

        if (passwordInputs.length > 0) {
          const formActions = htmlContent.match(/action\s*=\s*['"]([^'"]+)['"]/gi) || [];
          if (formActions.some((action) => !action.includes('https://'))) {
            threats.push('Password form submits to non-HTTPS endpoint - credentials at risk');
            risk = 'Critical Risk';
          }
        }

        details = `Deep scan completed. Analyzed ${htmlContent.length} characters of HTML/JavaScript code. Found ${externalScripts} external scripts, ${formMatches.length} forms, and ${passwordInputs.length} password fields.`;
      }

      if (risk === 'Critical Risk') {
        recommendation = '🚨 DANGER - Do not use this site';
        if (!details) details = 'Severe security threats detected. This site may steal your information.';
      } else if (risk === 'High Risk') {
        recommendation = '⚠️ High risk - avoid entering sensitive data';
        if (!details) details = 'Multiple security concerns found. Do not enter passwords or personal information.';
      } else if (risk === 'Moderate Risk') {
        recommendation = '⚡ Proceed with caution';
        if (!details) details = 'Some security concerns detected. Verify site legitimacy before proceeding.';
      } else {
        recommendation = '✅ Basic security checks passed';
        if (!details) details = 'No major threats detected, but always remain vigilant online.';
      }

      if (threats.length === 0) {
        threats.push('No obvious security threats detected');
      }

      return { risk, threats, recommendation, details, success: true };
    } catch (error) {
      return {
        risk: 'Analysis Error',
        threats: ['Unable to complete analysis: ' + error.message],
        recommendation: 'Scan failed',
        details: 'Please check the URL format and try again.',
        success: false,
      };
    }
  };

  // Quick scan - URL analysis only
  const analyzeURL = (urlString) => {
    const threats = [];
    let risk = 'Low Risk';

    try {
      let normalizedUrl = urlString.trim();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = 'http://' + normalizedUrl;
      }

      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname.toLowerCase();
      const protocol = urlObj.protocol;

      if (protocol === 'http:') {
        threats.push('🔓 Unsecured HTTP connection - data not encrypted');
        risk = 'High Risk';
      }

      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.loan', '.work'];
      if (suspiciousTLDs.some((tld) => domain.endsWith(tld))) {
        threats.push('⚠️ Suspicious domain extension often used by malicious sites');
        risk = 'High Risk';
      }

      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        threats.push('🔢 Using IP address instead of domain name');
        risk = 'High Risk';
      }

      const commonBrands = ['google', 'facebook', 'amazon', 'paypal', 'microsoft', 'apple', 'netflix'];
      for (const brand of commonBrands) {
        if (domain.includes(brand) && !domain.endsWith(`${brand}.com`) && !domain.endsWith(`.${brand}.com`)) {
          threats.push(`🎣 Possible phishing - impersonating "${brand}"`);
          risk = 'Critical Risk';
        }
      }

      if (domain.endsWith('.gov') || domain.endsWith('.gov.in') || domain.endsWith('.nic.in')) {
        threats.push('✅ Official government domain');
        risk = 'Low Risk';
      }

      const knownSafe = ['google.com', 'youtube.com', 'facebook.com', 'whatsapp.com', 'amazon.com', 'wikipedia.org'];
      if (knownSafe.some((safe) => domain === safe || domain.endsWith('.' + safe)) && protocol === 'https:') {
        threats.push('✅ Known legitimate and secure website');
        risk = 'Low Risk';
      }

      return { risk, threats, recommendation: '', details: '' };
    } catch (error) {
      return { risk: 'Analysis Error', threats: ['Invalid URL format'], recommendation: '', details: '' };
    }
  };

  const checkWebsite = async () => {
    if (!url) return;

    setIsAnalyzing(true);
    setResult(null);

    setTimeout(async () => {
      let analysis;

      if (scanType === 'deep') {
        analysis = await deepScanWebsite(url);
      } else {
        const quickAnalysis = analyzeURL(url);
        analysis = {
          ...quickAnalysis,
          recommendation: quickAnalysis.risk === 'Low Risk' ? '✅ Quick scan passed' : '⚠️ Threats detected',
          details: 'Quick URL-based scan only. For comprehensive analysis, use Deep Scan.',
        };
      }

      const riskColors = {
        'Low Risk': { color: '#4ade80', borderColor: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.1)' },
        'Moderate Risk': { color: '#facc15', borderColor: '#facc15', bgColor: 'rgba(250, 204, 21, 0.1)' },
        'High Risk': { color: '#fb923c', borderColor: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.1)' },
        'Critical Risk': { color: '#f87171', borderColor: '#f87171', bgColor: 'rgba(248, 113, 113, 0.1)' },
        'Analysis Error': { color: '#9ca3af', borderColor: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.1)' },
      };

      setResult({
        ...analysis,
        ...riskColors[analysis.risk],
        scanType: scanType,
      });

      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <ScrollView className="flex-1 bg-[#213448] p-4">
      <View className="max-w-2xl mx-auto w-full">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-[#EAE0CF] mb-2">🔍 Advanced Web Security Scanner</Text>
          <Text className="text-[#94B4C1] opacity-80">Detect keyloggers, spyware, and phishing threats</Text>
        </View>

        <View className="bg-[#547792] p-6 rounded-3xl border border-[#94B4C1]/20">
          {/* Scan Type Selector */}
          <View className="flex-row gap-3 p-1 bg-[#213448] rounded-xl mb-6">
            <TouchableOpacity
              onPress={() => setScanType('quick')}
              className={`flex-1 py-2 px-4 rounded-lg ${
                scanType === 'quick' ? 'bg-[#EAE0CF]' : ''
              }`}
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  scanType === 'quick' ? 'text-[#213448]' : 'text-[#94B4C1]'
                }`}
              >
                ⚡ Quick Scan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScanType('deep')}
              className={`flex-1 py-2 px-4 rounded-lg ${
                scanType === 'deep' ? 'bg-[#EAE0CF]' : ''
              }`}
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  scanType === 'deep' ? 'text-[#213448]' : 'text-[#94B4C1]'
                }`}
              >
                🔬 Deep Scan
              </Text>
            </TouchableOpacity>
          </View>

          <View className="relative mb-6">
            <TextInput
              placeholder="Enter URL (e.g., https://example.com)"
              placeholderTextColor="#94B4C1"
              value={url}
              onChangeText={setUrl}
              onSubmitEditing={checkWebsite}
              className="w-full bg-[#213448] text-[#EAE0CF] border-2 border-[#94B4C1]/20 rounded-2xl p-4"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {url && (
              <TouchableOpacity
                onPress={() => {
                  setUrl('');
                  setResult(null);
                }}
                className="absolute right-4 top-4"
              >
                <Text className="text-[#94B4C1] text-xl">×</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={checkWebsite}
            disabled={isAnalyzing || !url}
            className={`w-full py-4 rounded-2xl ${
              isAnalyzing || !url ? 'bg-[#94B4C1]/40' : 'bg-[#EAE0CF]'
            }`}
          >
            {isAnalyzing ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#213448" size="small" />
                <Text className="ml-2 text-[#213448] font-bold">
                  {scanType === 'deep' ? 'Deep Scanning...' : 'Quick Scanning...'}
                </Text>
              </View>
            ) : (
              <Text className="text-[#213448] font-bold text-center">
                {scanType === 'deep' ? '🔬' : '⚡'} Start {scanType === 'deep' ? 'Deep' : 'Quick'} Scan
              </Text>
            )}
          </TouchableOpacity>

          {/* Result Display */}
          {result && !isAnalyzing && (
            <View
              className="mt-6 p-6 rounded-2xl border-l-4"
              style={{
                backgroundColor: result.bgColor,
                borderLeftColor: result.borderColor,
              }}
            >
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text
                    className="text-xs uppercase font-black tracking-widest mb-1"
                    style={{ color: result.color }}
                  >
                    {result.risk}
                  </Text>
                  <Text className="text-[10px] text-[#94B4C1] opacity-60 uppercase tracking-wide">
                    {result.scanType} scan
                  </Text>
                </View>
                <Text className="text-2xl">
                  {result.risk === 'Low Risk'
                    ? '✅'
                    : result.risk === 'Moderate Risk'
                    ? '⚠️'
                    : result.risk === 'Critical Risk'
                    ? '🚨'
                    : '🛡️'}
                </Text>
              </View>

              <Text className="text-lg font-bold text-[#EAE0CF] mb-2">{result.recommendation}</Text>

              <Text className="text-xs text-[#94B4C1] opacity-70 mb-4" numberOfLines={2}>
                {url}
              </Text>

              {/* Threats */}
              {result.threats && result.threats.length > 0 && (
                <View className="mt-4 p-4 bg-[#213448]/30 rounded-xl">
                  <Text className="text-xs font-bold text-[#EAE0CF] uppercase tracking-wide mb-3">
                    🔍 Security Findings ({result.threats.length}):
                  </Text>
                  {result.threats.map((threat, i) => (
                    <View key={i} className="flex-row items-start mb-2">
                      <Text className="text-xs mr-2" style={{ color: result.color }}>
                        ▸
                      </Text>
                      <Text className="flex-1 text-sm text-[#94B4C1]">{threat}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Details */}
              {result.details && (
                <View className="mt-4 pt-4 border-t border-[#94B4C1]/10">
                  <Text className="text-xs text-[#94B4C1] opacity-90">{result.details}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View className="mt-6 gap-3">
          <View className="p-4 bg-[#213448]/40 rounded-xl border border-dashed border-blue-400/20">
            <View className="flex-row items-center mb-2">
              <Text className="text-lg mr-2">⚡</Text>
              <Text className="text-xs font-bold text-[#EAE0CF]">Quick Scan</Text>
            </View>
            <Text className="text-xs text-[#94B4C1]">
              Analyzes URL structure, domain reputation, and phishing patterns
            </Text>
          </View>

          <View className="p-4 bg-[#213448]/40 rounded-xl border border-dashed border-purple-400/20">
            <View className="flex-row items-center mb-2">
              <Text className="text-lg mr-2">🔬</Text>
              <Text className="text-xs font-bold text-[#EAE0CF]">Deep Scan</Text>
            </View>
            <Text className="text-xs text-[#94B4C1]">
              Fetches and analyzes website code for keyloggers, spyware, and malicious scripts
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
