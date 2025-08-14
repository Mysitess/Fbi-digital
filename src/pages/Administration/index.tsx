import React from 'react';
import './index.css';
import { ROLES } from '../../utils/constants';
import type { User } from '../../utils/types';

interface AdministrationPageProps {
    users: User[];
    onAdminClick: (admin: User) => void;
    rankNames: string[];
}

export const AdministrationPage = ({ users, onAdminClick, rankNames }: AdministrationPageProps) => {
    const adminsAndDirectors = users
        .filter(u => [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(u.role))
        .sort((a,b) => b.rank - a.rank);

    return (
        <div>
            <h1 className="page-title">Руководство и Администрация</h1>
            <div className="roster-grid">
                {adminsAndDirectors.map(admin => (
                    <div key={admin.id} className="agent-card" onClick={() => onAdminClick(admin)}>
                        <div className="agent-card-header">
                            <span className="agent-card-name">{admin.nickname}</span>
                            <span className={`agent-card-status ${admin.onDuty ? 'on-duty' : 'off-duty'}`}>
                                {admin.onDuty ? 'На смене' : 'Не на смене'}
                            </span>
                        </div>
                        <p className="agent-card-info">{rankNames[admin.rank]}</p>
                        <p className="agent-card-info">{admin.position}</p>
                        <p className="agent-card-info">Отдел: {admin.department}</p>
                    </div>
                ))}
            </div>
            {adminsAndDirectors.length === 0 && <p>Руководство не найдено.</p>}
        </div>
    );
};
