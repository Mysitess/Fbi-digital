import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { TABS, ROLES, PENALTY_TYPE, getRoleFromRank } from './src/utils/constants';
import { createInitialData } from './src/utils/data';
import type { AppData, User, NewsItem, Notification, Report, BlacklistedPerson, AuditLogItem } from './src/utils/types';

import { LoginScreen } from './src/components/LoginScreen';
import { Sidebar } from './src/components/Sidebar';
import { Header } from './src/components/Header';
import { Modal } from './src/components/Modal';
import { Widget } from './src/components/Widget';


import { Dashboard } from './src/pages/Dashboard';
import { ProfilePage } from './src/pages/Profile';
import { RosterPage } from './src/pages/Roster';
import { ChatPage } from './src/pages/Chat';
import { NewsPage } from './src/pages/News';
import { NewsArchivePage } from './src/pages/NewsArchive';
import { RaidsPage } from './src/pages/Raids';
import { PenaltiesPage } from './src/pages/Penalties';
import { PromotionsPage } from './src/pages/Promotions';
import { CharterPage } from './src/pages/Charter';
import { AdministrationPage } from './src/pages/Administration';
import { AdminPanel } from './src/pages/AdminPanel';
import { ReportsReviewPage } from './src/pages/ReportsReview';
import { DepartmentRosterPage } from './src/pages/DepartmentRoster';


const systemUpdateMessages = {
    PROMOTIONS: {
        titleCase: 'Системы Повышения',
        accusativeCase: 'систему повышения',
        link: TABS.PROMOTIONS
    },
    PENALTIES: {
        titleCase: 'Системы снятия наказаний',
        accusativeCase: 'систему снятия наказаний',
        link: TABS.PENALTIES
    },
    CHARTER: {
        titleCase: 'Устава ФБР',
        accusativeCase: 'устав ФБР',
        link: TABS.CHARTER
    }
};

// --- HELPER: DESKTOP NOTIFICATIONS ---
const showDesktopNotification = (title: string, options: NotificationOptions) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, options);
    }
};

// --- NEW PAGE COMPONENT: BLACKLIST ---
const BlacklistPage = ({
    blacklist,
    setBlacklist,
    currentUser,
    addAuditLog
}: {
    blacklist: BlacklistedPerson[];
    setBlacklist: (updater: (prev: BlacklistedPerson[]) => BlacklistedPerson[]) => void;
    currentUser: User;
    addAuditLog: (action: string, details: string) => void;
}) => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<BlacklistedPerson | null>(null);
    const [newItem, setNewItem] = useState<{ nickname: string; term: string; reason: string; isPermanent: boolean }>({
        nickname: '',
        term: new Date().toISOString().split('T')[0],
        reason: '',
        isPermanent: false,
    });

    const canManage = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(currentUser.role);

    const handleAddItem = () => {
        if (!newItem.nickname || !newItem.reason) return;
        const newEntry: BlacklistedPerson = {
            id: Date.now(),
            nickname: newItem.nickname,
            reason: newItem.reason,
            term: newItem.isPermanent ? 'Вечный' : `Выдача ${new Date(newItem.term).toLocaleDateString()}`,
            issuerNickname: currentUser.nickname,
            date: new Date().toISOString(),
        };
        setBlacklist(prev => [newEntry, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addAuditLog('Добавление в ЧС', `Ник: ${newItem.nickname}, Причина: ${newItem.reason}`);
        setAddModalOpen(false);
        setNewItem({ nickname: '', term: new Date().toISOString().split('T')[0], reason: '', isPermanent: false });
    };

    const handleDeleteItem = () => {
        if (!itemToDelete) return;
        setBlacklist(prev => prev.filter(item => item.id !== itemToDelete.id));
        addAuditLog('Удаление из ЧС', `Ник: ${itemToDelete.nickname}`);
        setItemToDelete(null);
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{TABS.BLACKLIST}</h1>
                {canManage && <button className="button" onClick={() => setAddModalOpen(true)}>Добавить в ЧС</button>}
            </div>
            <div className="roster-grid">
                {blacklist.length > 0 ? (
                    blacklist.map(item => (
                        <div key={item.id} className="agent-card">
                            <h3 className="agent-card-name">{item.nickname}</h3>
                            <p className="agent-card-info"><strong>Срок:</strong> {item.term}</p>
                            <p className="agent-card-info"><strong>Причина:</strong> {item.reason}</p>
                            <p className="agent-card-info" style={{marginTop: 'auto', paddingTop: '10px'}}>Выдал: {item.issuerNickname}</p>
                            {canManage && <button className="button danger small" style={{marginTop: '10px'}} onClick={() => setItemToDelete(item)}>Удалить</button>}
                        </div>
                    ))
                ) : (
                    <p>Черный список пуст.</p>
                )}
            </div>
            
            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Добавить в черный список">
                <div className="form">
                    <div className="form-group">
                        <label>Ник нарушителя</label>
                        <input type="text" value={newItem.nickname} onChange={e => setNewItem(p => ({...p, nickname: e.target.value}))} />
                    </div>
                    <div className="form-group">
                        <label>Причина</label>
                        <textarea value={newItem.reason} onChange={e => setNewItem(p => ({...p, reason: e.target.value}))} />
                    </div>
                     <div className="form-group">
                        <label>
                            <input type="checkbox" checked={newItem.isPermanent} onChange={e => setNewItem(p => ({...p, isPermanent: e.target.checked}))} />
                            Вечный срок
                        </label>
                    </div>
                    {!newItem.isPermanent && (
                        <div className="form-group">
                            <label>Дата выдачи</label>
                            <input type="date" value={newItem.term} onChange={e => setNewItem(p => ({...p, term: e.target.value}))} />
                        </div>
                    )}
                    <div className="form-actions">
                        <button className="button" onClick={handleAddItem}>Добавить</button>
                    </div>
                </div>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Подтверждение удаления">
                <p>Вы уверены, что хотите удалить <strong>{itemToDelete?.nickname}</strong> из черного списка?</p>
                <div className="form-actions">
                    <button className="button danger" onClick={handleDeleteItem}>Удалить</button>
                    <button className="button" onClick={() => setItemToDelete(null)}>Отмена</button>
                </div>
            </Modal>
        </div>
    );
};

// --- NEW PAGE COMPONENT: ARCHIVED REPORTS ---
const ArchivedReportsPage = ({
    archivedReports,
    currentUser,
    onDelete,
    onView,
} : {
    archivedReports: Report[];
    currentUser: User;
    onDelete: (id: number) => void;
    onView: (archiveId: string) => void;
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const canManage = [ROLES.ADMIN, ROLES.DIRECTOR].includes(currentUser.role);
    
    const filteredReports = useMemo(() => {
        if (!searchQuery) return archivedReports;
        return archivedReports.filter(r => r.archiveId?.toLowerCase().includes(searchQuery.toLowerCase()) || r.authorNickname.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [archivedReports, searchQuery]);

    return (
         <div>
            <h1 className="page-title">{TABS.REPORTS_ARCHIVE}</h1>
            <div className="charter-search">
                <input
                    type="text"
                    placeholder="Поиск по ID рапорта или автору..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="content-list">
                {filteredReports.length > 0 ? filteredReports.map(report => (
                    <div key={report.id} className="content-item" onClick={() => onView(report.archiveId!)}>
                         <div className="content-item-header">
                            <h3 className="content-item-title">{`Рапорт #${report.archiveId}`}</h3>
                            <span className={`status-badge ${report.status === 'approved' ? 'status-approved' : 'status-rejected'}`}>{report.status}</span>
                         </div>
                        <p className="content-item-meta">Автор: {report.authorNickname} | Рассмотрел: {report.reviewerNickname}</p>
                    </div>
                )) : (
                    <p>Архив пуст или по вашему запросу ничего не найдено.</p>
                )}
            </div>
        </div>
    )
}

// --- NEW PAGE COMPONENT: ARCHIVED REPORT DETAIL ---
const ArchivedReportDetailPage = ({ reportId, archivedReports, onBack, onDelete, canManage } : { reportId: string, archivedReports: Report[], onBack: () => void, onDelete: (id: number) => void, canManage: boolean }) => {
    const report = archivedReports.find(r => r.archiveId === reportId);
    
    const copyLinkToClipboard = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            // maybe show a toast
        });
    }

    if (!report) {
        return (
            <div>
                <button className="button" onClick={onBack}>← Назад к архиву</button>
                <h1 className="page-title">Рапорт не найден</h1>
                <p>Рапорт с ID {reportId} не был найден в архиве.</p>
            </div>
        )
    }

    return (
        <div>
             <div className="page-header">
                <h1 className="page-title">{`Архивный рапорт #${report.archiveId}`}</h1>
                <button className="button" onClick={onBack}>← Назад к архиву</button>
            </div>
            
            <p><strong>Автор:</strong> {report.authorNickname}</p>
            <p><strong>Дата подачи:</strong> {new Date(report.date).toLocaleString()}</p>
            <p><strong>Рассмотрел:</strong> {report.reviewerNickname} ({new Date(report.reviewDate!).toLocaleString()})</p>
            <p><strong>Вердикт:</strong> <span className={`status-badge ${report.status === 'approved' ? 'status-approved' : 'status-rejected'}`}>{report.status}</span></p>

            <div className="content-detail-body" style={{ whiteSpace: 'pre-wrap' }}>{report.content}</div>
            <div className="form-actions">
                <button className="button" onClick={copyLinkToClipboard}>Копировать ссылку</button>
                 {canManage && <button className="button danger" onClick={() => { onDelete(report.id); onBack(); }}>Удалить</button>}
            </div>
        </div>
    )
}

// --- NEW PAGE COMPONENT: AUDIT LOG ---
const AuditLogPage = ({ auditLog }: { auditLog: AuditLogItem[] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredLog = useMemo(() => {
        if (!searchQuery) return auditLog;
        const lowerQuery = searchQuery.toLowerCase();
        return auditLog.filter(log => 
            log.userNickname.toLowerCase().includes(lowerQuery) ||
            log.action.toLowerCase().includes(lowerQuery) ||
            log.details.toLowerCase().includes(lowerQuery)
        );
    }, [auditLog, searchQuery]);

    return (
        <div>
            <h1 className="page-title">Журнал аудита</h1>
            <div className="charter-search">
                <input
                    type="text"
                    placeholder="Поиск по логам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="content-list">
                {filteredLog.length > 0 ? filteredLog.map(log => (
                     <div key={log.id} className="content-item" style={{cursor: 'default'}}>
                         <div className="content-item-header">
                            <h3 className="content-item-title">{log.action}</h3>
                         </div>
                        <p className="content-item-meta">Исполнитель: {log.userNickname} | {new Date(log.date).toLocaleString()}</p>
                        {log.details && <p style={{marginTop: '10px', opacity: 0.9}}>{log.details}</p>}
                    </div>
                )) : (
                     <p>Логи пусты или по вашему запросу ничего не найдено.</p>
                )}
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App = () => {
    const [data, setData] = useState<AppData>(() => {
        try {
            const savedData = localStorage.getItem('appData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // Basic validation to prevent crashes on data structure changes
                if (parsedData.users && parsedData.news && parsedData.promotionSystem && parsedData.chats && parsedData.charterText && parsedData.penaltySystem && parsedData.notifications && parsedData.rankNames && parsedData.departments) {
                    // Initialize new fields if they don't exist in old saved data
                    if (!parsedData.blacklist) parsedData.blacklist = [];
                    if (!parsedData.archivedReports) parsedData.archivedReports = [];
                    if (!parsedData.auditLog) parsedData.auditLog = [];
                    return parsedData;
                }
            }
        } catch (error) {
            console.error("Could not parse localStorage data:", error);
        }
        return createInitialData();
    });
    
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [initialNewsToOpen, setInitialNewsToOpen] = useState<number | string | null>(null);
    const [selectedArchivedReportId, setSelectedArchivedReportId] = useState<string | null>(null);

    
    // Agent Profile Modal State
    const [modalConfig, setModalConfig] = useState<{ type: string | null, agent: User | null }>({ type: null, agent: null });
    const [penaltyReason, setPenaltyReason] = useState('');
    const [fireReason, setFireReason] = useState('');
    const [newRank, setNewRank] = useState(0);
    const [newPosition, setNewPosition] = useState('');
    const [notification, setNotification] = useState({ isOpen: false, message: '' });
    const [penaltyToRemove, setPenaltyToRemove] = useState<{ agent: User; index: number } | null>(null);

    // Request desktop notification permission on load
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);
    
    // Handle URL hash for archived reports
     useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#/reports/archive/')) {
                const id = hash.substring('#/reports/archive/'.length);
                if (data.archivedReports.some(r => r.archiveId === id)) {
                    setActiveTab(TABS.REPORTS_ARCHIVE);
                    setSelectedArchivedReportId(id);
                }
            } else {
                 // If hash is cleared or changed to something else, reset the view
                 if (selectedArchivedReportId) {
                     setSelectedArchivedReportId(null);
                 }
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Check hash on initial load

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [data.archivedReports, selectedArchivedReportId]);

    // Simple session persistence for logged in user
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('loggedInUser');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                // Verify user still exists in our main data and update with fresh data
                const freshUser = data.users.find(u => u.id === user.id);
                if (freshUser) {
                     setLoggedInUser(freshUser);
                } else {
                     handleLogout();
                }
            }
        } catch (error) {
            console.error("Could not parse loggedInUser from localStorage:", error);
            localStorage.removeItem('loggedInUser');
        }
    }, [data.users]);

    // Persist all data to localStorage
    useEffect(() => {
        localStorage.setItem('appData', JSON.stringify(data));
    }, [data]);

    const handleLogin = (user: User) => {
        const fullUser = data.users.find(u => u.id === user.id);
        if (fullUser) {
            setLoggedInUser(fullUser);
            localStorage.setItem('loggedInUser', JSON.stringify(fullUser));
            setActiveTab(TABS.DASHBOARD);
        }
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        localStorage.removeItem('loggedInUser');
    };

    const handleArchiveNews = (idToArchive: number | string) => {
        const itemToArchive = data.news.find(item => item.id === idToArchive);
        if (itemToArchive) {
            setData(prevData => ({
                ...prevData,
                news: prevData.news.filter(item => item.id !== idToArchive),
                archivedNews: [{ ...itemToArchive, pinned: false }, ...prevData.archivedNews]
            }));
             addAuditLog('Архивирование новости', `Новость: "${itemToArchive.title}"`);
        }
    };
    
    const setUsers = (updater) => setData(prev => ({...prev, users: typeof updater === 'function' ? updater(prev.users) : updater}));
    const setNews = (updater) => setData(prev => ({...prev, news: typeof updater === 'function' ? updater(prev.news) : updater}));
    const setRaids = (updater) => setData(prev => ({...prev, raids: typeof updater === 'function' ? updater(prev.raids) : updater}));
    const setReports = (updater) => setData(prev => ({...prev, reports: typeof updater === 'function' ? updater(prev.reports) : updater}));
    const setNotifications = (updater) => setData(prev => ({...prev, notifications: typeof updater === 'function' ? updater(prev.notifications) : updater}));
    const setChats = (updater) => setData(prev => ({...prev, chats: typeof updater === 'function' ? updater(prev.chats) : updater}));
    const setRankNames = (updater) => setData(prev => ({...prev, rankNames: typeof updater === 'function' ? updater(prev.rankNames) : updater}));
    const setDepartments = (updater) => setData(prev => ({...prev, departments: typeof updater === 'function' ? updater(prev.departments) : updater}));
    const setPromotionSystem = (updater) => setData(prev => ({...prev, promotionSystem: typeof updater === 'function' ? updater(prev.promotionSystem) : updater}));
    const setBlacklist = (updater) => setData(prev => ({...prev, blacklist: typeof updater === 'function' ? updater(prev.blacklist) : updater}));
    const setArchivedReports = (updater) => setData(prev => ({...prev, archivedReports: typeof updater === 'function' ? updater(prev.archivedReports) : updater}));
    const setAuditLog = (updater) => setData(prev => ({...prev, auditLog: typeof updater === 'function' ? updater(prev.auditLog) : updater}));

    const addAuditLog = (action: string, details: string = '') => {
        if (!loggedInUser) return;
        const newLog: AuditLogItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            userNickname: loggedInUser.nickname,
            action,
            details,
        };
        setAuditLog((prev: AuditLogItem[]) => [newLog, ...prev]);
    }

    const handleNewsClickFromDashboard = (newsId: number | string) => {
        setActiveTab(TABS.NEWS);
        setInitialNewsToOpen(newsId);
    };

    // --- System Save Handlers with Notifications ---
    const createSystemUpdateNews = (updateKey: keyof typeof systemUpdateMessages) => {
       if (!loggedInUser) return;
       const messages = systemUpdateMessages[updateKey];
       
       const newNewsItem: NewsItem = {
           id: Date.now() + Math.random(),
           title: `Обновление: ${messages.titleCase}`,
           content: `${loggedInUser.nickname} обновил(а) ${messages.accusativeCase}. Пожалуйста, ознакомьтесь с изменениями.`,
           author: loggedInUser.nickname,
           date: new Date().toISOString(),
           pinned: false,
           comments: []
       };
       setNews(prevNews => [newNewsItem, ...prevNews]);

       const newNotification = {
            id: Date.now() + Math.random(),
            recipientId: null,
            text: `${loggedInUser.nickname} обновил(а) ${messages.accusativeCase}.`,
            type: 'global' as 'global',
            read: false,
            date: new Date().toISOString(),
            link: messages.link
        };
       setNotifications(prev => [...prev, newNotification]);
       addAuditLog(`Обновление системы: ${messages.titleCase}`, '');
   }

    const handleSavePromotionSystem = (newSystem) => {
        setPromotionSystem(() => newSystem);
        createSystemUpdateNews('PROMOTIONS');
        setNotification({ isOpen: true, message: "Система повышения обновлена. Уведомление создано." });
    };
    
    const handleSavePenaltySystem = (newSystem) => {
        setData(prev => ({...prev, penaltySystem: newSystem}));
        createSystemUpdateNews('PENALTIES');
        setNotification({ isOpen: true, message: "Система снятия наказаний обновлена. Уведомление создано." });
    };

    const handleSaveCharter = (newText) => {
        setData(prev => ({...prev, charterText: newText}));
        createSystemUpdateNews('CHARTER');
        setNotification({ isOpen: true, message: "Устав ФБР обновлен. Уведомление создано." });
    };

    const handleMarkNotificationsRead = () => {
        if (!loggedInUser) return;
        setNotifications(prev => prev.map(n =>
                (n.type === 'global' || n.recipientId === loggedInUser.id) ? { ...n, read: true } : n
            )
        );
    };

    const handleArchiveReport = (report: Report) => {
        const archivedReport = {
            ...report,
            archiveId: `R-${Date.now()}`
        };
        setReports(prev => prev.filter(r => r.id !== report.id));
        setArchivedReports(prev => [archivedReport, ...prev].sort((a,b) => new Date(b.reviewDate!).getTime() - new Date(a.reviewDate!).getTime()));
    };
    
    const handleDeleteArchivedReport = (reportId: number) => {
        const report = data.archivedReports.find(r => r.id === reportId);
        setArchivedReports(prev => prev.filter(r => r.id !== reportId));
        setNotification({isOpen: true, message: 'Архивный рапорт удален.'});
        addAuditLog('Удаление архивного рапорта', `ID: ${report?.archiveId || reportId}, Автор: ${report?.authorNickname || '???'}`);
    }
    
    const handleViewArchivedReport = (archiveId: string) => {
        setSelectedArchivedReportId(archiveId);
        window.location.hash = `#/reports/archive/${archiveId}`;
    };

    const handleBackToArchiveList = () => {
        setSelectedArchivedReportId(null);
        // Navigate back by clearing the specific report part of the hash
        const baseHash = window.location.hash.split('/').slice(0, 3).join('/');
        window.location.hash = baseHash;
    };


    // --- Agent Profile Modal Logic ---
    const openAgentModal = (agent: User) => {
        if (agent) {
            setModalConfig({ type: 'profile', agent });
            setNewRank(agent.rank);
            setNewPosition(agent.position);
        }
    };
    const closeModal = () => {
        setModalConfig({ type: null, agent: null });
        setPenaltyReason('');
        setFireReason('');
    }

    const canManageTarget = (manager: User, target: User) => {
        if (!manager || !target) return false;
        if (manager.id === target.id) return false; // Cannot manage self
        if (target.role === ROLES.ADMIN) return false; // Cannot manage admins
        if (manager.role === ROLES.ADMIN) return true; // Admins can manage any non-admin
        if(manager.role === ROLES.DIRECTOR && target.role === ROLES.DIRECTOR) return false;
        if(manager.role === ROLES.DEPUTY_DIRECTOR && [ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(target.role)) return false;
        return manager.rank > target.rank; // Higher rank can manage lower rank
    };

    const handleIssuePenalty = () => {
        const targetAgent = modalConfig.agent;
        if (!targetAgent || !penaltyReason) {
            setNotification({ isOpen: true, message: 'Причина наказания не может быть пустой.' });
            return;
        }
        const newPenalty = { type: PENALTY_TYPE, reason: penaltyReason, givenBy: loggedInUser!.nickname };

        setUsers(prev => prev.map(u => {
            if (u.id === targetAgent.id) {
                const updatedAgent = { ...u, penalties: [...u.penalties, newPenalty] };
                if(modalConfig.agent?.id === u.id) setModalConfig(prev => ({...prev, agent: updatedAgent}));
                return updatedAgent;
            }
            return u;
        }));
        
        const text = `Вам выдан строгий выговор от ${loggedInUser!.nickname}. Причина: ${penaltyReason}`;
        const newNotification: Notification = {
            id: Date.now(),
            recipientId: targetAgent.id,
            text: text,
            type: 'personal',
            read: false,
            date: new Date().toISOString(),
            link: TABS.PROFILE
        };
        setNotifications(prev => [...prev, newNotification]);
        showDesktopNotification('Новое наказание', { body: text, tag: `penalty-${newNotification.id}` });
        
        addAuditLog('Выдача наказания', `Агент: ${targetAgent.nickname}, Причина: ${penaltyReason}`);
        setNotification({ isOpen: true, message: `Наказание выдано.` });
        setModalConfig(prev => ({...prev, type: 'profile'}));
        setPenaltyReason('');
    };

    const handleConfirmRemovePenalty = () => {
        if (!penaltyToRemove) return;
        const { agent, index } = penaltyToRemove;
        
        const removedPenalty = agent.penalties[index];

        setUsers(prev => prev.map(u => {
            if (u.id === agent.id) {
                const newPenalties = [...u.penalties];
                newPenalties.splice(index, 1);
                const updatedAgent = { ...u, penalties: newPenalties };
                if(modalConfig.agent?.id === u.id) setModalConfig(prev => ({...prev, agent: updatedAgent}));
                return updatedAgent;
            }
            return u;
        }));

        addAuditLog('Снятие наказания', `Агент: ${agent.nickname}, Наказание: ${removedPenalty.reason}`);
        setNotification({ isOpen: true, message: `Наказание "${removedPenalty?.reason}" для ${agent.nickname} снято.` });
        setPenaltyToRemove(null);
    };

    const handleRankChange = () => {
        const targetAgent = modalConfig.agent;
        if (!targetAgent || !loggedInUser) return;

        if (loggedInUser.role !== ROLES.ADMIN && newRank >= loggedInUser.rank) {
            setNotification({ isOpen: true, message: "Вы не можете установить ранг выше или равный вашему." });
            return;
        }

        const newRole = getRoleFromRank(newRank);
        if (targetAgent.role === ROLES.ADMIN) {
             setNotification({ isOpen: true, message: "Роль и ранг администратора нельзя изменить." });
            return;
        }
        if(newRole === ROLES.DIRECTOR && loggedInUser.role !== ROLES.ADMIN) {
            setNotification({ isOpen: true, message: "Только администратор может назначить директора." });
            return;
        }
        if(newRole === ROLES.DEPUTY_DIRECTOR && ![ROLES.ADMIN, ROLES.DIRECTOR].includes(loggedInUser.role)) {
            setNotification({ isOpen: true, message: "Только директор или администратор может назначить заместителя." });
            return;
        }

        const newRankName = data.rankNames[newRank];
        const oldRankName = data.rankNames[targetAgent.rank];

        setUsers(prev => prev.map(u => {
            if (u.id === targetAgent.id) {
                const updatedAgent = { ...u, rank: newRank, position: newPosition, role: newRole };
                if(modalConfig.agent?.id === u.id) setModalConfig(prev => ({...prev, agent: updatedAgent}));
                return updatedAgent;
            }
            return u;
        }));
        
        addAuditLog(
            'Изменение ранга/должности',
            `Агент: ${targetAgent.nickname}. Ранг: ${oldRankName} -> ${newRankName}. Должность: "${targetAgent.position}" -> "${newPosition}"`
        );

        const notificationText = `Ваш ранг был изменен на "${newRankName}", а должность на "${newPosition}" администратором ${loggedInUser.nickname}.`;
        const newNotification: Notification = {
            id: Date.now(),
            recipientId: targetAgent.id,
            text: notificationText,
            type: 'personal',
            read: false,
            date: new Date().toISOString(),
            link: TABS.PROFILE
        };
        setNotifications(prev => [...prev, newNotification]);
        showDesktopNotification('Изменение должности', { body: notificationText, tag: `rank-${newNotification.id}` });


        setNotification({ isOpen: true, message: "Ранг и должность обновлены." });
        closeModal();
    }

    const handleConfirmFire = () => {
        const targetAgent = modalConfig.agent;
        if (targetAgent && fireReason && fireReason.trim()) {
            setUsers(prev => prev.filter(u => u.id !== targetAgent.id));
            addAuditLog('Увольнение агента', `Агент: ${targetAgent.nickname}, Причина: ${fireReason}`);
            setNotification({ isOpen: true, message: `${targetAgent.nickname} уволен. Причина: ${fireReason}` });
            closeModal();
        } else {
            setNotification({ isOpen: true, message: 'Причина увольнения не может быть пустой.' });
        }
    };
    
    const currentUserFull = data.users.find(u => u.id === loggedInUser?.id) || loggedInUser;

    const handleJoinDepartmentRequest = (departmentKey: string) => {
         if (!currentUserFull) return;

         if (currentUserFull.department === data.departments[departmentKey]) {
            setNotification({ isOpen: true, message: `Вы уже состоите в отделе ${data.departments[departmentKey]}.` });
            return;
         }

         const hasPendingRequest = data.reports.some(r => r.authorId === currentUserFull.id && r.type === 'department_join' && r.status === 'pending');
         if (hasPendingRequest) {
            setNotification({ isOpen: true, message: `У вас уже есть активный рапорт на вступление в отдел.` });
            return;
         }

         const newReport: Report = {
            id: Date.now(),
            authorId: currentUserFull.id,
            authorNickname: currentUserFull.nickname,
            type: 'department_join',
            content: `Прошу рассмотреть мое заявление на вступление в отдел ${data.departments[departmentKey]}.`,
            status: 'pending',
            date: new Date().toISOString(),
            department: data.departments[departmentKey],
            isFirstDepartmentRequest: !currentUserFull.departmentHistory || currentUserFull.departmentHistory.length === 0
        };
        setReports(prev => [...prev, newReport]);
        setNotification({ isOpen: true, message: `Рапорт на вступление в отдел ${data.departments[departmentKey]} подан.` });
    };

    const handleSendMessage = (channel, text) => {
        if(!loggedInUser) return;
        
        const newMessage = {
            id: Date.now(),
            author: loggedInUser.nickname,
            text,
            timestamp: new Date().toISOString()
        };
        setChats(prev => ({
            ...prev,
            [channel]: [...(prev[channel] || []), newMessage]
        }));
        
        // Handle mentions
        const mentionRegex = /@([\w_]+)/g;
        const mentions = text.match(mentionRegex);

        if (mentions) {
            const notifiedUserIds = new Set<number>();
            mentions.forEach(mentionStr => {
                const mentionTarget = mentionStr.substring(1);
                
                // Department mention
                const departmentKey = Object.keys(data.departments).find(key => data.departments[key] === mentionTarget);
                if(departmentKey) {
                    data.users.forEach(user => {
                        if(user.department === data.departments[departmentKey] && user.id !== loggedInUser.id) {
                            notifiedUserIds.add(user.id);
                        }
                    });
                } else {
                // User mention
                    const targetUser = data.users.find(u => u.nickname === mentionTarget);
                    if (targetUser && targetUser.id !== loggedInUser.id) {
                        notifiedUserIds.add(targetUser.id);
                    }
                }
            });

            notifiedUserIds.forEach(userId => {
                const notificationText = `Вас упомянул(а) ${loggedInUser.nickname} в чате #${channel}: "${text}"`;
                const newNotification: Notification = {
                    id: Date.now() + userId,
                    recipientId: userId,
                    text: notificationText,
                    type: 'personal',
                    read: false,
                    date: new Date().toISOString(),
                    link: TABS.CHAT,
                };
                setNotifications(prev => [...prev, newNotification]);
                showDesktopNotification('Новое упоминание в чате', { body: notificationText, tag: `mention-${newNotification.id}` });
            });
        }
    }

    if (!loggedInUser) {
        return <LoginScreen onLogin={handleLogin} users={data.users} setUsers={setUsers} />;
    }

    const renderActiveTab = () => {
        switch (activeTab) {
            case TABS.DASHBOARD: return <Dashboard agent={currentUserFull} users={data.users} news={data.news} onAgentClick={openAgentModal} notifications={data.notifications} onNewsClick={handleNewsClickFromDashboard} rankNames={data.rankNames} />;
            case TABS.PROFILE: return <ProfilePage agent={currentUserFull} setUsers={setUsers} reports={data.reports} rankNames={data.rankNames} />;
            case TABS.ROSTER: return <RosterPage users={data.users} onAgentClick={openAgentModal} rankNames={data.rankNames} />;
            case TABS.DEPARTMENT_ROSTER: return <DepartmentRosterPage users={data.users} onAgentClick={openAgentModal} rankNames={data.rankNames} department={selectedDepartment!} />;
            case TABS.CHAT: return <ChatPage chats={data.chats} currentUser={currentUserFull} onSendMessage={handleSendMessage} departments={data.departments} users={data.users} />;
            case TABS.NEWS: return <NewsPage news={data.news} setNews={setNews} handleArchiveNews={handleArchiveNews} currentUser={currentUserFull} initialItemToOpen={initialNewsToOpen} onItemOpened={() => setInitialNewsToOpen(null)} addAuditLog={addAuditLog} />;
            case TABS.NEWS_ARCHIVE: return <NewsArchivePage archivedNews={data.archivedNews} currentUser={currentUserFull} />;
            case TABS.RAIDS: return <RaidsPage raids={data.raids} setRaids={setRaids} currentUser={currentUserFull} addAuditLog={addAuditLog} />;
            case TABS.PENALTIES: return <PenaltiesPage currentUser={currentUserFull} penaltySystem={data.penaltySystem} onSave={handleSavePenaltySystem} setReports={setReports} />;
            case TABS.PROMOTIONS: return <PromotionsPage currentUser={currentUserFull} setReports={setReports} promotionSystem={data.promotionSystem} onSave={handleSavePromotionSystem} rankNames={data.rankNames} />;
            case TABS.CHARTER: return <CharterPage charterText={data.charterText} onSave={handleSaveCharter} currentUser={currentUserFull} />;
            case TABS.ADMINISTRATION: return <AdministrationPage users={data.users} onAdminClick={openAgentModal} rankNames={data.rankNames}/>;
            case TABS.ADMIN_PANEL: return <AdminPanel users={data.users} setUsers={setUsers} currentUser={currentUserFull} rankNames={data.rankNames} setRankNames={setRankNames} departments={data.departments} setDepartments={setDepartments} addAuditLog={addAuditLog} />;
            case TABS.REPORTS_REVIEW: return <ReportsReviewPage reports={data.reports} setReports={setReports} users={data.users} setUsers={setUsers} currentUser={currentUserFull} promotionSystem={data.promotionSystem} setNotifications={setNotifications} rankNames={data.rankNames} onArchiveReport={handleArchiveReport} addAuditLog={addAuditLog} />;
            case TABS.BLACKLIST: return <BlacklistPage blacklist={data.blacklist} setBlacklist={setBlacklist} currentUser={currentUserFull} addAuditLog={addAuditLog} />;
            case TABS.REPORTS_ARCHIVE: 
                return selectedArchivedReportId ? 
                    <ArchivedReportDetailPage 
                        reportId={selectedArchivedReportId}
                        archivedReports={data.archivedReports}
                        onBack={handleBackToArchiveList}
                        onDelete={handleDeleteArchivedReport}
                        canManage={[ROLES.ADMIN, ROLES.DIRECTOR].includes(currentUserFull.role)}
                    /> : 
                    <ArchivedReportsPage 
                        archivedReports={data.archivedReports}
                        currentUser={currentUserFull}
                        onDelete={handleDeleteArchivedReport}
                        onView={handleViewArchivedReport}
                    />;
            case TABS.AUDIT_LOG: return <AuditLogPage auditLog={data.auditLog} />;
            default: return <Dashboard agent={currentUserFull} users={data.users} news={data.news} onAgentClick={openAgentModal} notifications={data.notifications} onNewsClick={handleNewsClickFromDashboard} rankNames={data.rankNames} />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                loggedInUser={currentUserFull}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                departments={data.departments}
                onJoinDepartmentRequest={handleJoinDepartmentRequest}
            />
            <div className="main-wrapper">
                <Header
                    agent={currentUserFull}
                    onLogout={handleLogout}
                    setActiveTab={setActiveTab}
                    notifications={data.notifications}
                    onMarkNotificationsRead={handleMarkNotificationsRead}
                />
                <main className="main-content" role="main">
                    {renderActiveTab()}
                </main>
            </div>

            {/* --- Global Agent Profile Modal --- */}
            {modalConfig.agent && (
                <>
                <Modal isOpen={modalConfig.type === 'profile'} onClose={closeModal} title={`Профиль: ${modalConfig.agent?.nickname}`}>
                    <div className="profile-details">
                        <div className="profile-detail-row inline-action">
                            <span><strong>Ранг:</strong> {data.rankNames[modalConfig.agent.rank]}</span>
                             {canManageTarget(currentUserFull, modalConfig.agent) && (
                                <button className="button small" onClick={() => setModalConfig(prev => ({...prev, type: 'rank'}))}>Изменить ранг</button>
                             )}
                        </div>
                        <div className="profile-detail-row inline-action">
                             <span><strong>Должность:</strong> {modalConfig.agent.position}</span>
                             {canManageTarget(currentUserFull, modalConfig.agent) && (
                                <button className="button small" onClick={() => setModalConfig(prev => ({...prev, type: 'rank'}))}>Изменить должность</button>
                             )}
                        </div>
                        <div className="profile-detail-row">
                            <span><strong>Отдел:</strong> {modalConfig.agent.department}</span>
                        </div>
                        <div className="profile-detail-row wide inline-action">
                            <p><strong>Наказания:</strong></p>
                            {canManageTarget(currentUserFull, modalConfig.agent) && (
                                <button className="button small warning" onClick={() => setModalConfig(prev => ({...prev, type: 'penalty'}))}>Выдать</button>
                            )}
                        </div>
                        
                        {modalConfig.agent.penalties.length > 0 ? (
                            <ul className="penalty-list">
                                {modalConfig.agent.penalties.map((p, i) => 
                                    <li key={i} className="penalty-item">
                                        <span>{p.type}: {p.reason} (выдал: {p.givenBy})</span>
                                        {canManageTarget(currentUserFull, modalConfig.agent!) && (
                                            <button className="button danger small" onClick={() => setPenaltyToRemove({agent: modalConfig.agent!, index: i})}>Снять</button>
                                        )}
                                    </li>
                                )}
                            </ul>
                        ) : <p>Нет</p>}

                        {canManageTarget(currentUserFull, modalConfig.agent) && (
                             <div className="profile-actions-fire">
                                <button className="button danger" onClick={() => setModalConfig(prev => ({...prev, type: 'fire'}))}>Уволить агента</button>
                            </div>
                        )}
                    </div>
                </Modal>
                <Modal isOpen={modalConfig.type === 'rank'} onClose={closeModal} title={`Изменить ранг/должность для ${modalConfig.agent?.nickname}`}>
                     <div className="form">
                        <div className="form-group">
                            <label>Новый ранг</label>
                             <select value={newRank} onChange={e => setNewRank(parseInt(e.target.value, 10))} disabled={modalConfig.agent?.role === ROLES.ADMIN}>
                                {data.rankNames.map((rankName, index) => (
                                    <option key={index} value={index}>{rankName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Новая должность</label>
                             <input type="text" value={newPosition} onChange={e => setNewPosition(e.target.value)} disabled={modalConfig.agent?.role === ROLES.ADMIN} />
                        </div>
                        <div className="form-actions">
                            <button className="button" onClick={handleRankChange}>Сохранить</button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={modalConfig.type === 'penalty'} onClose={closeModal} title={`Выдать наказание для ${modalConfig.agent?.nickname}`}>
                    <div className="form">
                         <div className="form-group">
                            <label>Тип наказания</label>
                            <input type="text" value={PENALTY_TYPE} disabled />
                        </div>
                        <div className="form-group">
                            <label>Причина</label>
                            <textarea value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} required />
                        </div>
                        <div className="form-actions">
                            <button className="button" onClick={handleIssuePenalty}>Выдать</button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={!!penaltyToRemove} onClose={() => setPenaltyToRemove(null)} title={`Снять наказание для ${penaltyToRemove?.agent.nickname}`}>
                    <div>
                        <p>Вы уверены, что хотите снять следующее наказание?</p>
                        <p><strong>Наказание:</strong> {penaltyToRemove && `${penaltyToRemove.agent.penalties[penaltyToRemove.index].type}: ${penaltyToRemove.agent.penalties[penaltyToRemove.index].reason}`}</p>
                        <div className="form-actions">
                            <button className="button warning" onClick={handleConfirmRemovePenalty}>Снять</button>
                            <button className="button" onClick={() => setPenaltyToRemove(null)}>Отмена</button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={modalConfig.type === 'fire'} onClose={closeModal} title={`Уволить ${modalConfig.agent?.nickname}`}>
                    <div className="form">
                        <div className="form-group">
                            <label>Причина увольнения</label>
                            <textarea value={fireReason} onChange={e => setFireReason(e.target.value)} required />
                        </div>
                        <div className="form-actions">
                            <button className="button danger" onClick={handleConfirmFire}>Уволить</button>
                            <button className="button" onClick={closeModal}>Отмена</button>
                        </div>
                    </div>
                </Modal>
                </>
            )}
            {/* --- Global Notification Modal --- */}
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

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}