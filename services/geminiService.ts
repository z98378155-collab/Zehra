import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MessageTemplate, SearchResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMarketingMessage = async (topic: string, audience: string): Promise<MessageTemplate> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Bir özel okul yönetimi için resmi duyuru/bilgilendirme metni hazırla.
      Konu: ${topic}. 
      Hedef Kitle: ${audience} (Örn: Veliler, Öğrenciler, Öğretmenler). 
      Dil: Türkçe.
      Ton: Kurumsal, saygılı ve net.
      Bağlam: Okul ödemeleri, veli toplantıları, resmi tatiller vb. olabilir.
      Format: JSON object with 'subject' (Konu Başlığı) and 'body' (Duyuru Metni) fields.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return { subject: "Hata", body: "Mesaj oluşturulamadı." };
    return JSON.parse(text) as MessageTemplate;
  } catch (error) {
    console.error("Announcement generation failed:", error);
    return { subject: "Hata", body: "Bir hata oluştu." };
  }
};

export const searchMarketTrends = async (query: string): Promise<{ text: string, sources: SearchResult[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Eğitim sektörü ve okul yönetimi için araştır ve özetle (MEB yönetmelikleri, özel okul ücret politikaları, eğitim teknolojileri): ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Sonuç bulunamadı.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: SearchResult[] = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return { text, sources };
  } catch (error) {
    console.error("Search failed:", error);
    return { text: "Arama sırasında bir hata oluştu.", sources: [] };
  }
};

// Live API Helpers - Same implementation
export const createPcmBlob = (data: Float32Array): { data: string, mimeType: string } => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  return {
    data: base64Data,
    mimeType: 'audio/pcm;rate=16000',
  };
};

export const decodeAudio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectLiveSession = async (
    onOpen: () => void,
    onMessage: (message: LiveServerMessage) => void,
    onClose: () => void,
    onError: (e: ErrorEvent) => void
) => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: onOpen,
            onmessage: onMessage,
            onclose: (e) => onClose(),
            onerror: onError
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: "You are an administrative assistant for a private school in Turkey. You help parents with payment inquiries, school schedules, and general information. You are formal, polite, and knowledgeable about school finance."
        }
    });
}