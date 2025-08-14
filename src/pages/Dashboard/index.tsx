import React from 'react';
import './index.css';
import { Widget } from '../../components/Widget';
import type { User, NewsItem, Notification } from '../../utils/types';

interface DashboardProps {
    agent: User;
    users: User[];
    news: NewsItem[];
    notifications: Notification[];
    onAgentClick: (agent: User) => void;
    onNewsClick: (id: number | string) => void;
    rankNames: string[];
}

export const Dashboard = ({ agent, users, news, onAgentClick, onNewsClick, notifications, rankNames }: DashboardProps) => {
    const onDutyAgents = users.filter(u => u.onDuty);
    const displayNews = news ? [...news].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).slice(0, 5) : [];
    
    const personalNotifications = (notifications || [])
        .filter(n => n.recipientId === agent.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // show latest 5

    return (
        <>
            <h1 className="page-title">Добро пожаловать, Агент {agent.nickname}</h1>
            <div className="dashboard">
                <Widget title="Агенты на смене">
                     {onDutyAgents.length > 0 ? (
                        <ul>
                            {onDutyAgents.map(agent => (
                                <li key={agent.id} className="stat-item interactive" onClick={() => onAgentClick(agent)}>
                                    <span>{agent.nickname}</span>
                                    <span>{rankNames[agent.rank]}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>На смене никого нет.</p>
                    )}
                </Widget>

                <Widget title="Последние новости">
                     <ul>
                        {displayNews.map(n => <li className="interactive" key={n.id} onClick={() => onNewsClick(n.id)}>{n.title}</li>)}
                    </ul>
                </Widget>

                <Widget title="Ваши уведомления">
                   {personalNotifications.length > 0 ? (
                        <ul>
                            {personalNotifications.map(n => <li key={n.id}>{n.text}</li>)}
                        </ul>
                   ) : (
                        <p>У вас нет новых личных уведомлений.</p>
                   )}
                </Widget>
            </div>
        </>
    );
};
