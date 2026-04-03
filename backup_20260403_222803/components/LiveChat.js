import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LiveChat({ userId, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatId = `chat_${userId}`;

  useEffect(() => {
    if (isOpen && userId) {
      loadMessages();
      subscribeToMessages();
      markAsRead();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setMessages(data);
        const unread = data.filter(m => !m.read && m.sender !== 'user').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        if (!isOpen && payload.new.sender !== 'user') {
          setUnreadCount(prev => prev + 1);
          toast.success('New message from support!');
        }
        if (payload.new.sender !== 'user') {
          markAsRead();
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const markAsRead = async () => {
    if (!userId) return;
    
    await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .eq('sender', 'admin')
      .eq('read', false);
    setUnreadCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!userId) {
      toast.error('Please login to chat');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: userId,
          sender: 'user',
          message: newMessage,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!userId) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <div className="relative">
          <span className="text-2xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold">Live Chat Support</h3>
                <p className="text-white/80 text-xs">We usually reply in minutes</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <span className="text-4xl">💬</span>
                  <p className="mt-2">Start a conversation!</p>
                  <p className="text-xs mt-1">Our support team is here to help</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}