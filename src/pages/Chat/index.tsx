import React, { useState, useMemo } from 'react';
import './index.css';
import type { Chats, User } from '../../utils/types';

interface ChatPageProps {
    chats: Chats;
    currentUser: User;
    onSendMessage: (channel: string, text: string) => void;
    departments: { [key: string]: string };
    users: User[];
}

export const ChatPage = ({ chats, currentUser, onSendMessage, departments, users }: ChatPageProps) => {
    const [activeChannel, setActiveChannel] = useState('general');
    const [message, setMessage] = useState('');
    
    const chatChannels = ['general', ...Object.values(departments).filter(name => name !== departments.MANAGEMENT && name !== departments.ACADEMY)];

    const allMentionables = useMemo(() => {
        const departmentNames = Object.values(departments);
        const userNicknames = users.map(u => u.nickname);
        return new Set([...departmentNames, ...userNicknames]);
    }, [departments, users]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(activeChannel, message);
            setMessage('');
        }
    };

    const renderMessageText = (text: string) => {
        const mentionRegex = /@([\w_]+)/g;
        const parts = text.split(mentionRegex);

        return parts.map((part, i) => {
            if (i % 2 === 1 && allMentionables.has(part)) { // Odd parts are the captured groups
                return <span key={i} className="chat-mention">@{part}</span>
            }
            return part;
        })
    }
    
    return (
        <div className="chat-container">
            <aside className="chat-sidebar">
                <h3 className="widget-title">Каналы</h3>
                <ul className="chat-channel-list">
                    {chatChannels.map(channel => (
                        <li key={channel}>
                            <button 
                                className={`nav-button ${activeChannel === channel ? 'active' : ''}`}
                                onClick={() => setActiveChannel(channel)}
                            >
                                #{channel}
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="chat-main">
                <div className="chat-messages">
                    {chats[activeChannel] && chats[activeChannel].length > 0 ? chats[activeChannel].map(msg => (
                        <div key={msg.id} className="chat-message">
                            <span className="chat-message-author">{msg.author}:</span>
                            <span className="chat-message-text">{renderMessageText(msg.text)}</span>
                            <span className="chat-message-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                    )).reverse() : (
                        <p className="chat-message-info">Сообщений в этом канале еще нет.</p>
                    )}
                </div>
                <form className="message-input-form" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        placeholder={`Сообщение в #${activeChannel}`} 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button type="submit">Отправить</button>
                </form>
            </main>
        </div>
    )
};
