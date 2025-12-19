import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

function ProviderChat({ onClose }) {
  const { api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/providers/chats');
        setActiveChats(data || []);
        if (data && data.length > 0) {
          setSelectedChat(data[0]._id);
        }
      } catch {
        // Mock data
        setActiveChats([
          { _id: '1', customer: { user: { fullName: 'Customer 1' } } },
          { _id: '2', customer: { user: { fullName: 'Customer 2' } } },
        ]);
      }
    };
    load();
  }, [api]);

  useEffect(() => {
    if (selectedChat) {
      // Load messages for selected chat
      setMessages([
        { _id: '1', text: 'Hello, when will you arrive?', sender: 'customer', timestamp: new Date() },
        { _id: '2', text: 'I will be there in 30 minutes', sender: 'provider', timestamp: new Date() },
      ]);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      _id: Date.now().toString(),
      text: newMessage,
      sender: 'provider',
      timestamp: new Date(),
    }]);
    setNewMessage('');
  };

  return (
    <div className="flex h-full flex-col bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 className="text-lg font-bold text-white">Chat with Customers</h2>
        <motion.button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ✕
        </motion.button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
          {activeChats.map((chat) => (
            <motion.div
              key={chat._id}
              onClick={() => setSelectedChat(chat._id)}
              className={`cursor-pointer border-b border-slate-700 p-3 transition-all ${
                selectedChat === chat._id ? 'bg-slate-700' : 'hover:bg-slate-700/50'
              }`}
              whileHover={{ x: 4 }}
            >
              <p className="font-semibold text-white">
                {chat.customer?.user?.fullName || 'Customer'}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg._id}
                  className={`flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${
                      msg.sender === 'provider'
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-primary-500"
              />
              <motion.button
                type="button"
                onClick={handleSend}
                className="rounded-lg bg-primary-500 px-4 py-2 font-semibold text-white hover:bg-primary-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Send
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderChat;

