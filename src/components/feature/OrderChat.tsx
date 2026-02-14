import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export interface OrderChatMessage {
  id: string;
  order_id: string;
  sender_type: 'customer' | 'driver';
  sender_id: string;
  sender_name: string | null;
  content: string;
  created_at: string;
}

interface OrderChatProps {
  orderId: string;
  senderType: 'customer' | 'driver';
  senderId: string;
  senderName: string;
  otherPartyName: string;
  className?: string;
}

export default function OrderChat({
  orderId,
  senderType,
  senderId,
  senderName,
  otherPartyName,
  className = '',
}: OrderChatProps) {
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!error) setMessages((data as OrderChatMessage[]) || []);
      setLoading(false);
    };
    fetchMessages();
  }, [orderId]);

  useEffect(() => {
    const channel = supabase
      .channel(`order_messages:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as OrderChatMessage]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const { error } = await supabase.from('order_messages').insert({
      order_id: orderId,
      sender_type: senderType,
      sender_id: senderId,
      sender_name: senderName,
      content: text,
    });
    if (!error) setInput('');
    setSending(false);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 text-gray-500 ${className}`}>
        <i className="ri-loader-4-line animate-spin text-xl"></i>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden ${className}`}>
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <i className="ri-chat-3-line text-orange-500"></i>
        <span className="font-medium text-gray-800">Messages avec {otherPartyName}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[280px] bg-gray-50/50">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Aucun message. Envoyez le premier.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_type === senderType;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {!isMe && msg.sender_name && (
                    <p className="text-xs font-medium text-gray-500 mb-0.5">{msg.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>
      <div className="p-3 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Écrivez votre message..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          disabled={sending}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {sending ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-send-plane-line"></i>}
        </button>
      </div>
    </div>
  );
}
