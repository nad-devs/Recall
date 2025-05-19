import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'conversations.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ conversations: [] }));
}

export interface Conversation {
  id: string;
  text: string;
  summary: string;
  concepts: any[];
  createdAt: string;
}

export const storage = {
  async saveConversation(conversation: Omit<Conversation, 'id' | 'createdAt'>) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const newConversation = {
      ...conversation,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    data.conversations.push(newConversation);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return newConversation;
  },

  async getConversations() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return data.conversations;
  },

  async getConversation(id: string) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return data.conversations.find((c: Conversation) => c.id === id);
  }
}; 