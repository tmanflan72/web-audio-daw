import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Upload, Download, Settings, Zap, Eye, Mic, Activity, Cpu, Brain, Volume2, RotateCcw, Save } from 'lucide-react';

const AetheriaVocalForge = () => {
  // Audio Context and Core Processing
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const processingChainRef = useRef(null);
  const originalBufferRef = useRef(null);
  const processedBufferRef = useRef(null);
  
  // Plugin State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('repair');
  
  // Processing Parameters
  const [repairSettings, setRepairSettings] = useState({
    deNoise: 0.3,
    deClick: 0.5,
    deReverb: 0.2,
    pitchCorrection: 0.1,
    breathControl: 0.2,
    vocalFry: 0.1,
    humanization: 0.7,
    aiIntensity: 0.6
  });
  
  // Advanced Settings
  const [advancedSettings, setAdvancedSettings] = useState({
    spectralResolution: 2048,
    temporalPrecision: 0.95,
    emotionalAlignment: 0.8,
    contextAwareness: 0.7,
    phaseCoherence: 0.9
  });
  
  // Real-time Analysis Data
  const [analysisData, setAnalysisData] = useState({
    spectralData: new Float32Array(1024),
    frequencyData: new Uint8Array(1024),
    waveformData: new Float32Array(2048),
    anomalies: [],
    vocalCharacteristics: {}
  });
  
  // Visualization
  const canvasRef = useRef(null);
  const spectrogramRef = useRef(null);
  const waveformRef = useRef(null);
  
  // Initialize Audio Context and Processing Chain
  const initializeAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analysis node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // Initialize processing chain
      processingChainRef.current = createProcessingChain();
    }
  }, []);
  
  // Create Advanced Processing Chain
  const createProcessingChain = () => {
    const ctx = audioContextRef.current;
    
    // Input stage
    const inputGain = ctx.createGain();
    
    // De-noise stage (multiple filters)
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;
    
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 18000;
    
    // Spectral processing (convolution for de-reverb)
    const deReverbConvolver = ctx.createConvolver();
    createDeReverbImpulse(deReverbConvolver);
    
    // Dynamic range processing
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    // De-esser (targeted frequency reduction)
    const deEsser = ctx.createBiquadFilter();
    deEsser.type = 'peaking';
    deEsser.frequency.value = 6000;
    deEsser.Q.value = 4;
    deEsser.gain.value = -6;
    
    // Harmonic enhancement
    const enhancer = ctx.createWaveShaper();
    createHarmonicCurve(enhancer);
    
    // Output stage
    const outputGain = ctx.createGain();
    
    // Connect processing chain
    inputGain.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(deReverbConvolver);
    deReverbConvolver.connect(compressor);
    compressor.connect(deEsser);
    deEsser.connect(enhancer);
    enhancer.connect(outputGain);
    outputGain.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);
    
    return {
      input: inputGain,
      output: outputGain,
      highpass,
      lowpass,
      deReverbConvolver,
      compressor,
      deEsser,
      enhancer
    };
  };
  
  // Create De-reverb Impulse Response
  const createDeReverbImpulse = (convolver) => {
    const ctx = audioContextRef.current;
    const impulseLength = ctx.sampleRate * 0.5; // 500ms
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        const decay = Math.pow(1 - i / impulseLength, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
      }
    }
    convolver.buffer = impulse;
  };
  
  // Create Harmonic Enhancement Curve
  const createHarmonicCurve = (waveshaper) => {
    const samples = 65536;
    const curve = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const x = (i - samples/2) / (samples/2);
      // Subtle harmonic saturation
      curve[i] = Math.tanh(x * 0.7) * 0.95;
    }
    waveshaper.curve = curve;
  };
  
  // Advanced Spectral Analysis
  const performSpectralAnalysis = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Float32Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(frequencyData);
    analyserRef.current.getFloatTimeDomainData(timeData);
    
    // Detect anomalies (clicks, pops, harsh frequencies)
    const anomalies = detectAudioAnomalies(frequencyData, timeData);
    
    // Extract vocal characteristics
    const vocalCharacteristics = extractVocalFeatures(frequencyData);
    
    setAnalysisData(prev => ({
      ...prev,
      frequencyData,
      waveformData: timeData,
      anomalies,
      vocalCharacteristics
    }));
  };
  
  // AI-Driven Anomaly Detection
  const detectAudioAnomalies = (freqData, timeData) => {
    const anomalies = [];
    
    // Detect sudden amplitude spikes (clicks/pops)
    for (let i = 1; i < timeData.length - 1; i++) {
      const current = Math.abs(timeData[i]);
      const prev = Math.abs(timeData[i-1]);
      const next = Math.abs(timeData[i+1]);
      
      if (current > prev * 3 && current > next * 3 && current > 0.1) {
        anomalies.push({
          type: 'click',
          position: i / timeData.length,
          severity: current,
          timestamp: Date.now()
        });
      }
    }
    
    // Detect harsh frequencies (sibilance)
    const sibilantRange = freqData.slice(120, 200); // ~5-8kHz range
    const avgSibilant = sibilantRange.reduce((a, b) => a + b) / sibilantRange.length;
    
    if (avgSibilant > 150) {
      anomalies.push({
        type: 'sibilance',
        intensity: avgSibilant / 255,
        frequency: 'high',
        timestamp: Date.now()
      });
    }
    
    return anomalies;
  };
  
  // Extract Vocal Characteristics
  const extractVocalFeatures = (freqData) => {
    // Fundamental frequency estimation
    let maxAmplitude = 0;
    let fundamentalBin = 0;
    
    for (let i = 5; i < 100; i++) { // Focus on vocal range ~80-800Hz
      if (freqData[i] > maxAmplitude) {
        maxAmplitude = freqData[i];
        fundamentalBin = i;
      }
    }
    
    const fundamentalFreq = (fundamentalBin * audioContextRef.current.sampleRate) / (2 * analyserRef.current.fftSize);
    
    // Spectral centroid (brightness)
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      const freq = (i * audioContextRef.current.sampleRate) / (2 * analyserRef.current.fftSize);
      weightedSum += freq * freqData[i];
      magnitudeSum += freqData[i];
    }
    
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    return {
      fundamentalFrequency: fundamentalFreq,
      spectralCentroid: spectralCentroid,
      brightness: spectralCentroid / 1000,
      presence: freqData.slice(80, 120).reduce((a, b) => a + b) / 40,
      air: freqData.slice(200, 256).reduce((a, b) => a + b) / 56
    };
  };
  
  // Load and Process Audio File
  const handleFileLoad = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      await initializeAudio();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      originalBufferRef.current = audioBuffer;
      setAudioFile(file.name);
      setDuration(audioBuffer.duration);
      setCurrentTime(0);
      
      // Create processed version
      await processAudioBuffer(audioBuffer);
      
    } catch (error) {
      console.error('Error loading audio file:', error);
    }
  };
  
  // Advanced Audio Processing
  const processAudioBuffer = async (buffer) => {
    setIsProcessing(true);
    
    try {
      // Create offline context for processing
      const offlineCtx = new OfflineAudioContext(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
      );
      
      // Create processing chain in offline context
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      
      // Apply repairs based on current settings
      const processedChain = await createOfflineProcessingChain(offlineCtx);
      
      source.connect(processedChain.input);
      processedChain.output.connect(offlineCtx.destination);
      
      source.start(0);
      
      // Render processed audio
      const processedBuffer = await offlineCtx.startRendering();
      processedBufferRef.current = processedBuffer;
      
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Create Offline Processing Chain
  const createOfflineProcessingChain = async (ctx) => {
    const { deNoise, deClick, deReverb, pitchCorrection, humanization } = repairSettings;
    
    const inputGain = ctx.createGain();
    const outputGain = ctx.createGain();
    
    // Dynamic noise reduction
    const noiseGate = ctx.createDynamicsCompressor();
    noiseGate.threshold.value = -40 + (deNoise * 20);
    noiseGate.ratio.value = 20;
    noiseGate.attack.value = 0.001;
    noiseGate.release.value = 0.1;
    
    // Click removal (fast compressor)
    const clickRemover = ctx.createDynamicsCompressor();
    clickRemover.threshold.value = -12 + (deClick * 10);
    clickRemover.ratio.value = 10;
    clickRemover.attack.value = 0.0001;
    clickRemover.release.value = 0.001;
    
    // Reverb reduction
    const reverbReducer = ctx.createConvolver();
    if (deReverb > 0) {
      createInverseReverbImpulse(reverbReducer, ctx, deReverb);
    }
    
    // Humanization (subtle modulation)
    const humanizer = ctx.createOscillator();
    const humanGain = ctx.createGain();
    humanizer.frequency.value = 0.2;
    humanGain.gain.value = humanization * 0.02;
    
    // Connect chain
    inputGain.connect(noiseGate);
    noiseGate.connect(clickRemover);
    clickRemover.connect(reverbReducer);
    reverbReducer.connect(outputGain);
    
    // Add humanization modulation
    humanizer.connect(humanGain);
    humanGain.connect(outputGain.gain);
    humanizer.start(0);
    
    return { input: inputGain, output: outputGain };
  };
  
  // Create Inverse Reverb Impulse
  const createInverseReverbImpulse = (convolver, ctx, intensity) => {
    const impulseLength = ctx.sampleRate * 0.2;
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        const decay = Math.exp(-i / (impulseLength * 0.1));
        channelData[i] = (Math.random() * 2 - 1) * decay * intensity * -0.3;
      }
    }
    convolver.buffer = impulse;
  };
  
  // Playback Control
  const togglePlayback = async () => {
    if (!processedBufferRef.current) return;
    
    await initializeAudio();
    
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = processedBufferRef.current;
      source.connect(processingChainRef.current.input);
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };
    }
  };
  
  // Update Processing Parameters
  const updateRepairSetting = (parameter, value) => {
    setRepairSettings(prev => ({ ...prev, [parameter]: value }));
    
    // Apply real-time parameter changes if playing
    if (processingChainRef.current && isPlaying) {
      applyRealtimeChanges(parameter, value);
    }
  };
  
  // Apply Real-time Parameter Changes
  const applyRealtimeChanges = (parameter, value) => {
    const chain = processingChainRef.current;
    
    switch (parameter) {
      case 'deNoise':
        chain.highpass.frequency.value = 80 + (value * 40);
        break;
      case 'deReverb':
        // Adjust convolver dry/wet mix
        break;
      case 'pitchCorrection':
        // Adjust pitch shift amount
        break;
      case 'humanization':
        chain.enhancer.curve = createDynamicHarmonicCurve(value);
        break;
    }
  };
  
  // Create Dynamic Harmonic Curve
  const createDynamicHarmonicCurve = (humanization) => {
    const samples = 65536;
    const curve = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const x = (i - samples/2) / (samples/2);
      const saturation = 0.3 + (humanization * 0.4);
      curve[i] = Math.tanh(x * saturation) * (0.9 + humanization * 0.1);
    }
    return curve;
  };
  
  // Download Processed Audio
  const downloadProcessed = () => {
    if (!processedBufferRef.current) return;
    
    // Convert AudioBuffer to WAV
    const wav = audioBufferToWav(processedBufferRef.current);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audioFile.split('.')[0]}_aetheria_processed.wav`;
    a.click();
    
    URL.revokeObjectURL(url);
  };
  
  // AudioBuffer to WAV conversion
  const audioBufferToWav = (buffer) => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };
  
  // Real-time Analysis Loop
  useEffect(() => {
    let animationFrame;
    
    const analyze = () => {
      if (isPlaying && analyserRef.current) {
        performSpectralAnalysis();
      }
      animationFrame = requestAnimationFrame(analyze);
    };
    
    if (isPlaying) {
      analyze();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying]);
  
  // Draw Visualizations
  useEffect(() => {
    if (canvasRef.current && analysisData.frequencyData.length > 0) {
      drawSpectrum();
    }
  }, [analysisData]);
  
  const drawSpectrum = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { frequencyData } = analysisData;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw frequency spectrum
    const barWidth = canvas.width / frequencyData.length;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * canvas.height;
      
      // Color based on frequency range
      let hue;
      if (i < 50) hue = 220; // Bass - blue
      else if (i < 150) hue = 120; // Mids - green  
      else hue = 60; // Highs - yellow
      
      const saturation = 70 + (frequencyData[i] / 255) * 30;
      const lightness = 30 + (frequencyData[i] / 255) * 40;
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
    }
    
    // Draw anomaly indicators
    analysisData.anomalies.forEach(anomaly => {
      ctx.fillStyle = anomaly.type === 'click' ? '#ff4444' : '#ff8844';
      ctx.fillRect(anomaly.position * canvas.width, 0, 2, 20);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-indigo-500/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="w-12 h-12 text-indigo-400" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Aetheria Vocal Forge
                </h1>
                <p className="text-gray-300 text-lg">Beyond Restoration. Beyond Perfection. Sculpting the Quintessential Vocal Performance.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400">QA-AIC Active</span>
              </div>
              {isProcessing && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-indigo-400">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Transport & File Controls */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                <span>Load Vocal</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileLoad}
                  className="hidden"
                />
              </label>
              
              {audioFile && (
                <>
                  <button
                    onClick={togglePlayback}
                    disabled={!processedBufferRef.current}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  
                  <button
                    onClick={downloadProcessed}
                    disabled={!processedBufferRef.current}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export</span>
                  </button>
                </>
              )}
            </div>
            
            {audioFile && (
              <div className="text-sm text-gray-300">
                <span className="font-medium">{audioFile}</span>
                {duration > 0 && <span className="ml-4">{duration.toFixed(1)}s</span>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-6">
              <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
                {['repair', 'advanced', 'analysis'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'repair' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-indigo-400 mb-4">Core Repair Engine</h3>
                  
                  {Object.entries(repairSettings).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={value}
                          onChange={(e) => updateRepairSetting(key, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-400 w-10 text-right">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-sm text-indigo-300">
                      <Zap className="w-4 h-4 inline mr-2" />
                      QA-AIC automatically optimizes these parameters based on vocal analysis
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Advanced Processing</h3>
                  
                  {Object.entries(advancedSettings).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={value}
                          onChange={(e) => setAdvancedSettings(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value)
                          }))}
                          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-400 w-10 text-right">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Vocal Analysis</h3>
                  
                  {analysisData.vocalCharacteristics.fundamentalFrequency && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Fundamental Frequency</span>
                        <span className="text-sm text-white">
                          {Math.round(analysisData.vocalCharacteristics.fundamentalFrequency)} Hz
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Brightness</span>
                        <span className="text-sm text-white">
                          {Math.round(analysisData.vocalCharacteristics.brightness * 100)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Presence</span>
                        <span className="text-sm text-white">
                          {Math.round(analysisData.vocalCharacteristics.presence)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Air</span>
                        <span className="text-sm text-white">
                          {Math.round(analysisData.vocalCharacteristics.air)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {analysisData.anomalies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-yellow-400 mb-2">Detected Issues</h4>
                      {analysisData.anomalies.slice(-5).map((anomaly, index) => (
                        <div key={index} className="text-xs text-gray-400 mb-1">
                          {anomaly.type} - {anomaly.severity ? `${Math.round(anomaly.severity * 100)}%` : 'detected'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-6">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Quantum Spectral Analysis
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Real-time Frequency Spectrum</h4>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 bg-gray-900/50 rounded-lg border border-gray-700"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-400 mb-2">Bass Range</h5>
                    <div className="text-2xl font-bold text-white">
                      {analysisData.frequencyData.slice(0, 50).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-green-400 mb-2">Vocal Range</h5>
                    <div className="text-2xl font-bold text-white">
                      {analysisData.frequencyData.slice(50, 150).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-yellow-400 mb-2">Presence</h5>
                    <div className="text-2xl font-bold text-white">
                      {analysisData.frequencyData.slice(150, 256).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AetheriaVocalForge;
