import React from 'react';
import './index.css';
import type { User, Report } from '../../utils/types';

interface ProfilePageProps {
    agent: User;
    setUsers: (updater: (prev: User[]) => User[]) => void;
    reports: Report[];
    rankNames: string[];
}

export const ProfilePage = ({ agent, setUsers, reports, rankNames }: ProfilePageProps) => {
    const handleDutyToggle = () => {
        setUsers(prevUsers => prevUsers.map(u => 
            u.id === agent.id ? { ...u, onDuty: !u.onDuty } : u
        ));
    };

    const myReports = reports.filter(r => r.authorId === agent.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getStatusClass = (status: string) => {
        switch(status) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'pending':
            default: return 'status-pending';
        }
    }
    
    return (
        <div>
            <h1 className="page-title">Личный профиль: {agent.nickname}</h1>
            <div className="profile-details">
                <p><strong>Ранг:</strong> {rankNames[agent.rank]}</p>
                <p><strong>Отдел:</strong> {agent.department}</p>
                <p><strong>Статус:</strong> <span className={agent.onDuty ? 'agent-card-status on-duty' : 'agent-card-status off-duty'}>{agent.onDuty ? 'На смене' : 'Не на смене'}</span></p>
                <div className="profile-actions">
                    <button className="button" onClick={handleDutyToggle}>
                        {agent.onDuty ? 'Закончить смену' : 'Выйти на службу'}
                    </button>
                </div>
                 <div className="widget" style={{marginTop: '30px'}}>
                    <h3 className="widget-title">Мои рапорты</h3>
                    {myReports.length > 0 ? (
                        <ul className="report-status-list">
                            {myReports.map(report => (
                                <li key={report.id}>
                                   <span>Тип: {report.type === 'promotion' ? 'Повышение' : 'Снятие наказания'} ({new Date(report.date).toLocaleDateString()})</span>
                                   <span className={`status-badge ${getStatusClass(report.status)}`}>{report.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p>У вас нет поданных рапортов.</p>}
                </div>
            </div>
        </div>
    );
}
