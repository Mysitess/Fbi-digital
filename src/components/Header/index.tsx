import React, { useState, useMemo } from 'react';
import './index.css';
import { TABS } from '../../utils/constants';
import type { User, Notification } from '../../utils/types';

interface HeaderProps {
    agent: User;
    onLogout: () => void;
    setActiveTab: (tab: string) => void;
    notifications: Notification[];
    onMarkNotificationsRead: () => void;
}

export const Header = ({ agent, onLogout, setActiveTab, notifications, onMarkNotificationsRead }: HeaderProps) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const relevantNotifications = useMemo(() => (notifications || [])
        .filter(n => n.type === 'global' || n.recipientId === agent.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notifications, agent.id]);

    const unreadCount = relevantNotifications.filter(n => !n.read).length;

    const handleBellClick = () => {
        setDropdownOpen(prev => !prev);
        if (!isDropdownOpen) {
            onMarkNotificationsRead();
        }
    };

    return (
      <header className="header">
        <div></div>
        <div className="header-profile">
            <div className="notification-bell">
              <button onClick={handleBellClick} aria-label={`Уведомления. ${unreadCount} непрочитанных.`}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {isDropdownOpen && (
                  <div className="notification-dropdown">
                      <div className="notification-dropdown-header">
                        <h3>Уведомления</h3>
                      </div>
                      {relevantNotifications.length > 0 ? relevantNotifications.map(n => (
                          <div key={n.id} className="notification-item" onClick={() => { if(n.link) setActiveTab(n.link); setDropdownOpen(false); }}>
                              <p>{n.text}</p>
                              <span>{new Date(n.date).toLocaleString()}</span>
                          </div>
                      )) : <div className="notification-item"><p>Нет новых уведомлений</p></div>}
                  </div>
              )}
          </div>
          <button className="nav-button profile-button" onClick={() => setActiveTab(TABS.PROFILE)}>
            {agent.nickname}
          </button>
          <button className="logout-button" onClick={onLogout}>Выход</button>
        </div>
      </header>
    );
};
