import { create } from "zustand";

const useChatbotStore = create((set) => ({
  isOpen: false,
  messages: [
    {
      id: 1,
      role: "bot",
      content: "Hi! I'm IntelliDesk Assistant. Describe your issue and I'll try to help before creating a ticket.",
      timestamp: new Date().toISOString(),
    },
  ],
  isTyping: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Date.now(),
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  setTyping: (isTyping) => set({ isTyping }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 1,
          role: "bot",
          content: "Hi! I'm IntelliDesk Assistant. Describe your issue and I'll try to help before creating a ticket.",
          timestamp: new Date().toISOString(),
        },
      ],
    }),
}));

export default useChatbotStore;
