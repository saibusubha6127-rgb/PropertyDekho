import { useState, useRef, useEffect, FormEvent } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello! I am your PropertyDekho Assistant. How can I help you find your dream home?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [propertiesContext, setPropertiesContext] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch a subset of properties for context
    const fetchContext = async () => {
      try {
        const q = query(collection(db, 'properties'), limit(20));
        const snapshot = await getDocs(q);
        setPropertiesContext(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) {
        console.error(e);
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const contextStr = propertiesContext.map(p => 
        `- ${p.bedrooms} BHK ${p.type} in ${p.location}. Price: ₹${p.price}. ID: ${p.id}`
      ).join('\n');

      const systemPrompt = `You are an AI Real Estate Assistant for "PropertyDekho".
      STRICT INSTRUCTION: You MUST ONLY provide information, answer questions, and give recommendations based EXACTLY on the following properties available on our website. 
      DO NOT answer questions about properties, villas, or real estate from other sources or general knowledge. If the user asks about something outside this list or not related to these properties, politely inform them that you can only answer questions about the properties currently available on PropertyDekho.
      
      Our Available Properties:
      ${contextStr}
      
      Be polite, concise, and helpful. Use the exact details provided above. Do not invent or hallucinate properties.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: { systemInstruction: systemPrompt },
        contents: [...messages, { role: 'user', content: userQuery }].map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || '' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gold-500 text-green-950 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white dark:bg-green-950 rounded-sm shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 dark:border-green-900"
          >
            {/* Header */}
            <div className="bg-green-950 text-gold-500 px-4 py-3 flex justify-between items-center z-10 relative">
              <div className="flex items-center space-x-2">
                <MessageSquare size={18} />
                <span className="font-bold text-sm tracking-wider uppercase">PropertyDekho AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-green-900/10">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded p-3 text-sm ${m.role === 'user' ? 'bg-green-950 text-white ml-auto rounded-tr-none' : 'bg-white dark:bg-green-900/50 border border-gray-200 dark:border-green-800 dark:text-gray-200 mr-auto rounded-tl-none'}`}>
                  {m.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white dark:bg-green-900/50 border border-gray-200 dark:border-green-800 text-gray-500 mr-auto max-w-[85%] rounded rounded-tl-none p-3 text-sm flex items-center">
                  <Loader2 size={16} className="animate-spin mr-2" /> Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-green-950 border-t border-gray-200 dark:border-green-900 flex space-x-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about properties..."
                className="flex-1 bg-gray-100 dark:bg-green-900/30 border-none rounded py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-gray-800 dark:text-gray-200"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-gold-500 text-green-950 p-2 rounded hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
