import React, { useState, useEffect } from 'react';
import './index.css';
import { ROLES, getRoleFromRank } from '../../utils/constants';
import type { User } from '../../utils/types';
import { Widget } from '../../components/Widget';
import { Modal } from '../../components/Modal';

interface AdminPanelProps {
    users: User[];
    setUsers: (updater: (prev: User[]) => User[]) => void;
    currentUser: User;
    rankNames: string[];
    setRankNames: (updater: (prev: string[]) => string[]) => void;
    departments: { [key: string]: string };
    setDepartments: (updater: (prev: { [key: string]: string }) => { [key: string]: string }) => void;
    addAuditLog: (action: string, details: string) => void;
}

export const AdminPanel = ({ users, setUsers, currentUser, rankNames, setRankNames, departments, setDepartments, addAuditLog }: AdminPanelProps) => {
    const [newAgentNick, setNewAgentNick] = useState('');
    const [selectedDirectorId, setSelectedDirectorId] = useState('');
    const [newAdminNick, setNewAdminNick] = useState('');
    const [notification, setNotification] = useState({ isOpen: false, message: '' });
    const [editableRankNames, setEditableRankNames] = useState(rankNames);
    const [editableDepts, setEditableDepts] = useState(departments);

    useEffect(() => {
        setEditableRankNames(rankNames);
    }, [rankNames]);
    
    useEffect(() => {
        setEditableDepts(departments);
    }, [departments]);


    const canManageAgents = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(currentUser.role);
    const isAdmin = currentUser.role === ROLES.ADMIN;
    
    const handleAddAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgentNick) return;
        
        const formattedName = newAgentNick.trim().replace(/ /g, '_');
        if (users.find(u => u.nickname.toLowerCase() === formattedName.toLowerCase())) {
            setNotification({ isOpen: true, message: 'Агент с таким ником уже существует.' });
            return;
        }

        const newAgent: User = {
            id: Date.now(),
            nickname: formattedName,
            password: null,
            rank: 0,
            role: ROLES.AGENT,
            position: 'Кадет',
            department: departments.ACADEMY,
            onDuty: false,
            penalties: [],
            lastPromotionDate: null,
            departmentHistory: [],
            isHead: false,
        };
        setUsers(prev => [...prev, newAgent]);
        addAuditLog('Добавление агента в whitelist', `Ник: ${formattedName}`);
        setNotification({ isOpen: true, message: `Агент ${formattedName} добавлен в белый список.` });
        setNewAgentNick('');
    };

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminNick) return;

        const formattedName = newAdminNick.trim().replace(/ /g, '_');
        if (users.find(u => u.nickname.toLowerCase() === formattedName.toLowerCase())) {
            setNotification({ isOpen: true, message: 'Пользователь с таким ником уже существует.' });
            return;
        }

        const newAdmin: User = {
            id: Date.now(),
            nickname: formattedName,
            password: null,
            rank: 9, // Admins share the top rank visually but have a distinct role
            role: ROLES.ADMIN,
            position: 'Администратор Портала',
            department: departments.MANAGEMENT,
            onDuty: false,
            penalties: [],
            lastPromotionDate: null,
            departmentHistory: [],
            isHead: true,
        };
        setUsers(prev => [...prev, newAdmin]);
        addAuditLog('Добавление администратора', `Ник: ${formattedName}`);
        setNotification({ isOpen: true, message: `Администратор ${formattedName} добавлен в белый список.` });
        setNewAdminNick('');
    };

    const handleSetDirector = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedDirectorId) return;
        const targetUserId = parseInt(selectedDirectorId, 10);
        const targetUser = users.find(u => u.id === targetUserId);
        if(!targetUser) return;
        
        const currentDirector = users.find(u => u.role === ROLES.DIRECTOR);

        setUsers(prev => prev.map(u => {
            if (currentDirector && u.id === currentDirector.id) {
                 return { ...u, role: getRoleFromRank(8), rank: 8, position: "Зам. Директора ФБР" };
            }
            if (u.id === targetUserId) return { ...u, role: ROLES.DIRECTOR, rank: 9, position: "Директор ФБР" };
            return u;
        }));
        addAuditLog('Назначение Директора ФБР', `Новый директор: ${targetUser.nickname}`);
        setNotification({ isOpen: true, message: 'Директор назначен.' });
        setSelectedDirectorId('');
    };

    const handleRankNameChange = (index: number, newName: string) => {
        const updatedNames = [...editableRankNames];
        updatedNames[index] = newName;
        setEditableRankNames(updatedNames);
    };

    const handleSaveRankNames = () => {
        setRankNames(() => editableRankNames);
        addAuditLog('Обновление названий рангов', `Новые названия: ${editableRankNames.join(', ')}`);
        setNotification({ isOpen: true, message: 'Названия рангов обновлены.' });
    };

    const handleDeptNameChange = (key: string, newName: string) => {
        setEditableDepts(prev => ({...prev, [key]: newName}));
    };
    
    const handleSaveDeptNames = () => {
        setDepartments(() => editableDepts);
        const details = Object.entries(editableDepts).map(([key, name]) => `${key}: ${name}`).join('; ');
        addAuditLog('Обновление названий отделов', details);
        setNotification({ isOpen: true, message: 'Названия отделов обновлены.' });
    };

    return (
        <div>
            <h1 className="page-title">Админ-панель</h1>
            {canManageAgents && (
                <Widget title="Добавить агента в белый список">
                    <form className="form" onSubmit={handleAddAgent}>
                        <div className="form-group">
                            <label htmlFor="nick">Ник (будет приведен к Nick_Name)</label>
                            <input id="nick" type="text" value={newAgentNick} onChange={e => setNewAgentNick(e.target.value)} required />
                        </div>
                        <button type="submit" className="button">Добавить</button>
                    </form>
                </Widget>
            )}
            {isAdmin && (
                <>
                    <Widget title="Назначить Директора ФБР">
                        <form className="form" onSubmit={handleSetDirector}>
                            <div className="form-group">
                                <label htmlFor="director">Выберите агента</label>
                                <select id="director" value={selectedDirectorId} onChange={e => setSelectedDirectorId(e.target.value)} required>
                                    <option value="">-- Выберите --</option>
                                    {users.filter(u => u.role !== ROLES.ADMIN).map(u => (
                                        <option key={u.id} value={u.id}>{u.nickname} ({u.position})</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="button">Назначить</button>
                        </form>
                    </Widget>
                    <Widget title="Редактировать названия отделов">
                        <div className="form">
                            {Object.entries(editableDepts).map(([key, name]) => (
                                <div className="form-group" key={key}>
                                    <label htmlFor={`dept-${key}`}>{key}</label>
                                    <input
                                        id={`dept-${key}`}
                                        type="text"
                                        value={name}
                                        onChange={(e) => handleDeptNameChange(key, e.target.value)}
                                        disabled={key === 'ACADEMY' || key === 'MANAGEMENT'}
                                    />
                                </div>
                            ))}
                            <div className="form-actions">
                                <button className="button" onClick={handleSaveDeptNames}>Сохранить названия отделов</button>
                            </div>
                        </div>
                    </Widget>
                    <Widget title="Редактировать названия рангов">
                        <div className="form">
                            {editableRankNames.map((name, index) => (
                                <div className="form-group" key={index}>
                                    <label htmlFor={`rank-${index}`}>Ранг {index}</label>
                                    <input 
                                        id={`rank-${index}`}
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => handleRankNameChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                             <div className="form-actions">
                                <button className="button" onClick={handleSaveRankNames}>Сохранить названия рангов</button>
                            </div>
                        </div>
                    </Widget>
                    <Widget title="Добавить администратора в белый список">
                        <form className="form" onSubmit={handleAddAdmin}>
                            <div className="form-group">
                                <label htmlFor="admin-nick">Ник (будет приведен к Nick_Name)</label>
                                <input id="admin-nick" type="text" value={newAdminNick} onChange={e => setNewAdminNick(e.target.value)} required />
                            </div>
                            <button type="submit" className="button">Добавить администратора</button>
                        </form>
                    </Widget>
                </>
            )}
            <Modal isOpen={notification.isOpen} onClose={() => setNotification({ isOpen: false, message: '' })} title="Уведомление">
                <div>
                   <p>{notification.message}</p>
                   <div className="form-actions">
                       <button className="button" onClick={() => setNotification({ isOpen: false, message: '' })}>OK</button>
                   </div>
                </div>
            </Modal>
        </div>
    );
};