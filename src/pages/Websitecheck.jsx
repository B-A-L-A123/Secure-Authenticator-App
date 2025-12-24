import { useState } from 'react';

const colors = {
  bg: 'bg-[#213448]',
  card: 'bg-[#547792]',
  accent: 'text-[#94B4C1]',
  text: 'text-[#EAE0CF]',
  border: 'border-[#94B4C1]/20'
};

export default function WebsiteCheck() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanType, setScanType] = useState('deep'); // 'quick' or 'deep'

  // Deep scan - fetches actual website content
  const deepScanWebsite = async (urlString) => {
    const threats = [];
    let risk = 'Low Risk';
    let recommendation = '';
    let details = '';

    try {
      // First, do basic URL analysis
      const urlAnalysis = analyzeURL(urlString);
      threats.push(...urlAnalysis.threats);
      
      // Try to fetch the actual website content
      let htmlContent = '';
      let fetchSuccess = false;
      
      try {
        const response = await fetch(urlString, {
          method: 'GET',
          mode: 'cors',
        });
        
        if (response.ok) {
          htmlContent = await response.text();
          fetchSuccess = true;
        }
      } catch (fetchError) {
        // CORS or network error - we can't fetch the content
        threats.push('Unable to fetch website content due to CORS restrictions');
        details = 'Deep scan limited: Cannot access website content directly. Using URL-based analysis only.';
      }

      if (fetchSuccess && htmlContent) {
        // KEYLOGGER DETECTION PATTERNS
        const keyloggerPatterns = [
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
          /keystroke/gi
        ];

        let keyloggerScore = 0;
        keyloggerPatterns.forEach(pattern => {
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

        // SPYWARE/TRACKING DETECTION
        const spywarePatterns = [
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
          /pixel/gi
        ];

        let spywareScore = 0;
        spywarePatterns.forEach(pattern => {
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

        // MALICIOUS SCRIPT DETECTION
        const maliciousPatterns = [
          /eval\s*\(/gi,
          /Function\s*\(/gi,
          /exec\s*\(/gi,
          /innerHTML\s*=/gi,
          /document\.write/gi,
          /fromCharCode/gi,
          /atob\s*\(/gi,
          /btoa\s*\(/gi,
          /unescape/gi,
          /\.createElement\s*\(\s*['"]script['"]/gi
        ];

        let maliciousScore = 0;
        maliciousPatterns.forEach(pattern => {
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

        // EXTERNAL SCRIPT ANALYSIS
        const scriptTags = htmlContent.match(/<script[^>]*src\s*=\s*['"]([^'"]+)['"]/gi) || [];
        const externalScripts = scriptTags.length;
        
        if (externalScripts > 20) {
          threats.push(`Found ${externalScripts} external scripts - higher risk of third-party tracking`);
          if (risk === 'Low Risk') risk = 'Moderate Risk';
        }

        // SUSPICIOUS DOMAINS IN SCRIPTS
        const suspiciousDomains = ['bit.ly', 'tinyurl', 'goo.gl', '.tk', '.ml', '.ga', '.cf', '.gq'];
        suspiciousDomains.forEach(domain => {
          if (htmlContent.includes(domain)) {
            threats.push(`Links to suspicious short URL service or domain: ${domain}`);
            if (risk === 'Low Risk') risk = 'Moderate Risk';
          }
        });

        // FORM SUBMISSION ANALYSIS
        const formMatches = htmlContent.match(/<form[^>]*>/gi) || [];
        const passwordInputs = htmlContent.match(/type\s*=\s*['"]password['"]/gi) || [];
        
        if (passwordInputs.length > 0) {
          const formActions = htmlContent.match(/action\s*=\s*['"]([^'"]+)['"]/gi) || [];
          if (formActions.some(action => !action.includes('https://'))) {
            threats.push('Password form submits to non-HTTPS endpoint - credentials at risk');
            risk = 'Critical Risk';
          }
        }

        details = `Deep scan completed. Analyzed ${htmlContent.length} characters of HTML/JavaScript code. Found ${externalScripts} external scripts, ${formMatches.length} forms, and ${passwordInputs.length} password fields.`;
      }

      // Determine final recommendation
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
        success: false
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
      if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
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
      if (knownSafe.some(safe => domain === safe || domain.endsWith('.' + safe)) && protocol === 'https:') {
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
          details: 'Quick URL-based scan only. For comprehensive analysis, use Deep Scan.'
        };
      }
      
      const riskColors = {
        'Low Risk': { color: 'text-green-400', border: 'border-green-400', bg: 'bg-green-400/10' },
        'Moderate Risk': { color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400/10' },
        'High Risk': { color: 'text-orange-400', border: 'border-orange-400', bg: 'bg-orange-400/10' },
        'Critical Risk': { color: 'text-red-400', border: 'border-red-400', bg: 'bg-red-400/10' },
        'Analysis Error': { color: 'text-gray-400', border: 'border-gray-400', bg: 'bg-gray-400/10' }
      };

      setResult({
        ...analysis,
        ...riskColors[analysis.risk],
        scanType: scanType
      });
      
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#213448] p-4 md:p-8">
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h2 className={`text-3xl font-bold ${colors.text} mb-2`}>🔍 Advanced Web Security Scanner</h2>
          <p className={`${colors.accent} opacity-80`}>Detect keyloggers, spyware, and phishing threats</p>
        </div>

        <div className={`${colors.card} p-6 md:p-8 rounded-[2rem] shadow-2xl border ${colors.border} space-y-6`}>
          {/* Scan Type Selector */}
          <div className="flex gap-3 p-1 bg-[#213448] rounded-xl">
            <button
              onClick={() => setScanType('quick')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                scanType === 'quick' 
                  ? 'bg-[#EAE0CF] text-[#213448]' 
                  : 'text-[#94B4C1] hover:text-[#EAE0CF]'
              }`}
            >
              ⚡ Quick Scan
            </button>
            <button
              onClick={() => setScanType('deep')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                scanType === 'deep' 
                  ? 'bg-[#EAE0CF] text-[#213448]' 
                  : 'text-[#94B4C1] hover:text-[#EAE0CF]'
              }`}
            >
              🔬 Deep Scan
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Enter URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkWebsite()}
              className={`w-full bg-[#213448] ${colors.text} border-2 ${colors.border} focus:border-[#EAE0CF]/50 rounded-2xl p-4 outline-none transition-all placeholder-[#94B4C1]/40`}
            />
            {url && (
              <button 
                onClick={() => {setUrl(''); setResult(null);}}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94B4C1] hover:text-[#EAE0CF] transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <button 
            onClick={checkWebsite}
            disabled={isAnalyzing || !url}
            className={`w-full py-4 rounded-2xl font-bold text-[#213448] transition-all transform active:scale-[0.98]
              ${isAnalyzing || !url ? 'bg-[#94B4C1]/40 cursor-not-allowed' : 'bg-[#EAE0CF] hover:shadow-[0_0_20px_rgba(234,224,207,0.3)]'}
            `}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-[#213448] border-t-transparent rounded-full animate-spin"></span>
                {scanType === 'deep' ? 'Deep Scanning...' : 'Quick Scanning...'}
              </span>
            ) : `${scanType === 'deep' ? '🔬' : '⚡'} Start ${scanType === 'deep' ? 'Deep' : 'Quick'} Scan`}
          </button>

          {/* Result Display */}
          {result && !isAnalyzing && (
            <div className={`mt-6 p-6 rounded-2xl border-l-4 ${result.bg} ${result.border} animate-in zoom-in-95 duration-300`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className={`text-xs uppercase font-black tracking-widest ${result.color} block`}>
                    {result.risk}
                  </span>
                  <span className="text-[10px] text-[#94B4C1] opacity-60 uppercase tracking-wide">
                    {result.scanType} scan
                  </span>
                </div>
                <span className="text-2xl">
                  {result.risk === 'Low Risk' ? '✅' : 
                   result.risk === 'Moderate Risk' ? '⚠️' : 
                   result.risk === 'Critical Risk' ? '🚨' : '🛡️'}
                </span>
              </div>
              
              <h3 className={`text-lg font-bold ${colors.text} mb-2`}>{result.recommendation}</h3>
              
              <p className={`text-xs ${colors.accent} opacity-70 mb-4 break-all`}>
                {url}
              </p>

              {/* Threats */}
              {result.threats && result.threats.length > 0 && (
                <div className="mt-4 p-4 bg-[#213448]/30 rounded-xl space-y-2">
                  <p className={`text-xs font-bold ${colors.text} uppercase tracking-wide mb-3 flex items-center gap-2`}>
                    <span>🔍</span> Security Findings ({result.threats.length}):
                  </p>
                  {result.threats.map((threat, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm py-1">
                      <span className={`${result.color} mt-1 text-xs`}>▸</span>
                      <span className={`${colors.accent} leading-relaxed`}>{threat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Details */}
              {result.details && (
                <div className="mt-4 pt-4 border-t border-[#94B4C1]/10">
                  <p className={`text-xs ${colors.accent} opacity-90 leading-relaxed`}>{result.details}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-[#213448]/40 rounded-xl border border-dashed border-blue-400/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <p className="text-xs font-bold text-[#EAE0CF]">Quick Scan</p>
            </div>
            <p className="text-xs text-[#94B4C1] leading-relaxed">
              Analyzes URL structure, domain reputation, and phishing patterns
            </p>
          </div>

          <div className="p-4 bg-[#213448]/40 rounded-xl border border-dashed border-purple-400/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔬</span>
              <p className="text-xs font-bold text-[#EAE0CF]">Deep Scan</p>
            </div>
            <p className="text-xs text-[#94B4C1] leading-relaxed">
              Fetches and analyzes website code for keyloggers, spyware, and malicious scripts
            </p>
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-6 space-y-3">
          <div className="p-4 bg-[#213448]/40 rounded-xl border border-dashed border-red-400/20 flex items-start gap-3">
            <span className="text-xl">⌨️</span>
            <div>
              <p className="text-xs font-bold text-[#EAE0CF] mb-1">Keylogger Detection</p>
              <p className="text-xs text-[#94B4C1]">
                Deep scan detects keyboard event listeners that may capture your keystrokes
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#213448]/40 rounded-xl border border-dashed border-yellow-400/20 flex items-start gap-3">
            <span className="text-xl">👁️</span>
            <div>
              <p className="text-xs font-bold text-[#EAE0CF] mb-1">Spyware Detection</p>
              <p className="text-xs text-[#94B4C1]">
                Identifies tracking scripts, geolocation access, and data collection mechanisms
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}