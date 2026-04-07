import { create } from 'zustand';
import api from '../api/client';

export const useChatStore = create((set, get) => ({
  messages: [{ role: 'assistant', content: 'Hello! I am TradeSphere AI. How can I help you today?' }],
  loading: false,
  sendMessage: async (text) => {
    const newMsg = { role: 'user', content: text };
    set({ messages: [...get().messages, newMsg], loading: true });
    try {
      const { data } = await api.post('/chatbot/message', { message: text });
      set({ messages: [...get().messages, { role: 'assistant', content: data.response }], loading: false });
    } catch (e) {
      set({ messages: [...get().messages, { role: 'assistant', content: 'Connection to AI failed.' }], loading: false });
    }
  },
  clearHistory: async () => {
    try { await api.delete('/chatbot/clear'); } catch(e) {}
    set({ messages: [{ role: 'assistant', content: 'History cleared. How can I assist you now?' }] });
  }
}));
