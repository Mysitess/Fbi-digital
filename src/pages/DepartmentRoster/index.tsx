import React from 'react';
import '../Roster/index.css'; // Reuse styles
import { ROLES } from '../../utils/constants';
import type { User } from '../../utils/types';

interface DepartmentRosterPageProps {
    users: User[];
    onAgentClick: (agent: User) => void;
    rankNames: string[];
    department: string;
}

export const DepartmentRosterPage = ({ users, onAgentClick, rankNames, department }: DepartmentRosterPageProps) => {
    const departmentAgents = users
        .filter(u => u.role !== ROLES.ADMIN && u.department === department)
        .sort((a, b) => {
            // Head of department first, then by rank
            if (a.isHead && !b.isHead) return -1;
            if (!a.isHead && b.isHead) return 1;
            return b.rank - a.rank;
        });

    return (
        <div>
            <h1 className="page-title">Состав отдела: {department}</h1>
            <div className="roster-grid">
                {departmentAgents.length > 0 ? departmentAgents.map(agent => (
                    <div key={agent.id} className="agent-card" onClick={() => onAgentClick(agent)}>
                        <div className="agent-card-header">
                            <span className="agent-card-name">{agent.nickname}</span>
                            <span className={`agent-card-status ${agent.onDuty ? 'on-duty' : 'off-duty'}`}>
                                {agent.onDuty ? 'На смене' : 'Не на смене'}
                            </span>
                        </div>
                        <p className="agent-card-info">{rankNames[agent.rank]}</p>
                        {agent.isHead && <p className="agent-card-info-head">Глава отдела</p>}
                    </div>
                )) : (
                    <p>В этом отделе нет агентов.</p>
                )}
            </div>
        </div>
    );
};
