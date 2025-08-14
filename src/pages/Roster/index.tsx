import React from 'react';
import './index.css';
import { ROLES } from '../../utils/constants';
import type { User } from '../../utils/types';

interface RosterPageProps {
    users: User[];
    onAgentClick: (agent: User) => void;
    rankNames: string[];
}

export const RosterPage = ({ users, onAgentClick, rankNames }: RosterPageProps) => {
    const agentsOnly = users
        .filter(u => u.role !== ROLES.ADMIN)
        .sort((a, b) => b.rank - a.rank);

    return (
        <div>
            <h1 className="page-title">Общий состав ФБР</h1>
            <div className="roster-grid">
                {agentsOnly.map(agent => (
                    <div key={agent.id} className="agent-card" onClick={() => onAgentClick(agent)}>
                        <div className="agent-card-header">
                            <span className="agent-card-name">{agent.nickname}</span>
                            <span className={`agent-card-status ${agent.onDuty ? 'on-duty' : 'off-duty'}`}>
                                {agent.onDuty ? 'На смене' : 'Не на смене'}
                            </span>
                        </div>
                        <p className="agent-card-info">{rankNames[agent.rank]}</p>
                        <p className="agent-card-info">Отдел: {agent.department}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
