import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Headphones, Volume2 } from 'lucide-react';
import { connectLiveSession, createPcmBlob, decodeAudio, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';

const VoiceSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const handleToggle = () => {
    if (isOpen) {
      stopSession();
      setIsOpen(false);
    } else {
      setIsOpen(true);
      startSession();
    }
  };

  const startSession = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const inputCtx = inputAudioContextRef.current;
      const outputCtx = outputAudioContextRef.current;

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      sessionPromiseRef.current = connectLiveSession(
        () => {
          setIsConnected(true);
          console.log("Live Session Connected");
        },
        async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          
          if (base64Audio && outputCtx) {
            setIsSpeaking(true);
            const audioBuffer = await decodeAudioData(
               decodeAudio(base64Audio),
               outputCtx,
               24000,
               1
            );
            
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            
            // Scheduling
            const currentTime = outputCtx.currentTime;
            if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
            }
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;

            sourcesRef.current.add(source);
            source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
            };
          }
          
          if (message.serverContent?.interrupted) {
             sourcesRef.current.forEach(src => {
                 try { src.stop(); } catch(e) {}
             });
             sourcesRef.current.clear();
             nextStartTimeRef.current = 0;
             setIsSpeaking(false);
          }
        },
        () => {
          setIsConnected(false);
          console.log("Live Session Closed");
        },
        (e) => {
          console.error(e);
          setError("Bağlantı hatası oluştu.");
          setIsConnected(false);
        }
      );

    } catch (err) {
      console.error(err);
      setError("Mikrofon izni gerekli.");
    }
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
        title="Sesli Asistan"
      >
        <Headphones className="w-6 h-6" />
        <span className="font-semibold hidden md:block">Asistan</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden font-sans">
      <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
        <h3 className="font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Sesli Destek (Canlı)
        </h3>
        <button onClick={handleToggle} className="hover:bg-blue-700 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        {error ? (
           <div className="text-red-500 text-center text-sm">{error}</div>
        ) : (
            <>
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${isConnected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {isConnected ? (
                    <div className={`absolute w-full h-full rounded-full border-4 border-blue-500 ${isSpeaking ? 'animate-ping opacity-20' : ''}`}></div>
                ) : null}
                <Mic className={`w-8 h-8 ${isConnected ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                
                <div className="text-center">
                <p className="font-medium text-gray-900">
                    {isConnected ? (isSpeaking ? "Dinliyorum..." : "Bağlandı, sizi dinliyorum...") : "Bağlanıyor..."}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Sorularınızı Türkçe olarak sorabilirsiniz.
                </p>
                </div>
            </>
        )}
      </div>

      <div className="bg-gray-50 p-3 text-xs text-center text-gray-400 border-t">
        Powered by Gemini Live API
      </div>
    </div>
  );
};

export default VoiceSupport;