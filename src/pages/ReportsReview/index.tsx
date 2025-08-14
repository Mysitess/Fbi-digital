import React, { useState } from 'react';
import './index.css';
import { TABS, getRoleFromRank, ROLES } from '../../utils/constants';
import type { Report, User, PromotionSystem, Notification as NotificationType } from '../../utils/types';
import { Modal } from '../../components/Modal';

interface ReportsReviewPageProps {
    reports: Report[];
    setReports: (updater: (prev: Report[]) => Report[]) => void;
    users: User[];
    setUsers: (updater: (prev: User[]) => User[]) => void;
    currentUser: User;
    promotionSystem: PromotionSystem;
    setNotifications: (updater: (prev: NotificationType[]) => NotificationType[]) => void;
    rankNames: string[];
    onArchiveReport: (report: Report) => void;
    addAuditLog: (action: string, details: string) => void;
}

export const ReportsReviewPage = ({ reports, setReports, users, setUsers, currentUser, promotionSystem, setNotifications, rankNames, onArchiveReport, addAuditLog }: ReportsReviewPageProps) => {
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [notification, setNotification] = useState({ isOpen: false, message: '' });

    const canReview = (report: Report, reviewer: User): boolean => {
        const leadershipRoles = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR];
        if (report.type !== 'department_join') {
            return true; // Promotions and penalties reviewed by leadership
        }
        
        // Department Join Logic
        if (leadershipRoles.includes(reviewer.role)) {
            return true;
        }

        if (report.isFirstDepartmentRequest && reviewer.isHead && reviewer.department === report.department) {
            return true;
        }

        return false;
    };

    const pendingReports = reports
        .filter(r => r.status === 'pending' && canReview(r, currentUser))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const getProbationForReport = (report: Report) => {
        if (report.type !== 'promotion') return null;
        const author = users.find(u => u.id === report.authorId);
        if (!author) return null;
        const promotionIndex = author.rank - 3;
        if (promotionSystem && promotionSystem.agentPromotions && promotionIndex >= 0 && promotionIndex < promotionSystem.agentPromotions.length) {
            return promotionSystem.agentPromotions[promotionIndex].probation;
        }
        return null;
    }


    const handleReview = (reportId: number, newStatus: 'approved' | 'rejected') => {
        const report = reports.find(r => r.id === reportId);
        if (!report) return;

        const reviewedReport = { ...report, status: newStatus, reviewerNickname: currentUser.nickname, reviewDate: new Date().toISOString() };
        
        onArchiveReport(reviewedReport);

        const authorId = report.authorId;
        const author = users.find(u => u.id === authorId);
        if(!author) return;

        const reportTitle = getReportTitle(report);
        addAuditLog(
            `Рассмотрение рапорта: ${newStatus === 'approved' ? 'Одобрен' : 'Отклонен'}`,
            `Тип: ${reportTitle}, Автор: ${report.authorNickname}`
        );

        if (newStatus === 'approved') {
            let notificationText = '';
            switch (report.type) {
                case 'promotion':
                    const newRank = Math.min(author.rank + 1, rankNames.length - 1);
                    notificationText = `Ваш рапорт на повышение одобрен. Вы повышены до ранга "${rankNames[newRank]}".`;
                    setUsers(prev => prev.map(u => u.id === authorId ? { ...u, rank: newRank, role: getRoleFromRank(newRank), lastPromotionDate: new Date().toISOString() } : u));
                    setNotification({ isOpen: true, message: `Ранг для ${report.authorNickname} повышен.` });
                    break;
                case 'penalty_removal':
                    notificationText = `Ваш рапорт на снятие наказания одобрен.`;
                    setUsers(prev => prev.map(u => {
                        if (u.id === authorId && u.penalties.length > 0) {
                            const newPenalties = [...u.penalties];
                            newPenalties.shift();
                            return { ...u, penalties: newPenalties };
                        }
                        return u;
                    }));
                    setNotification({ isOpen: true, message: `Наказание для ${report.authorNickname} снято.` });
                    break;
                case 'department_join':
                    if (report.department) {
                        notificationText = `Ваш рапорт на вступление в отдел ${report.department} одобрен.`;
                        setUsers(prev => prev.map(u => {
                            if (u.id === authorId) {
                                const newHistory = u.departmentHistory ? [...u.departmentHistory, u.department] : [u.department];
                                return { ...u, department: report.department!, isHead: false, departmentHistory: newHistory };
                            }
                            return u;
                        }));
                        setNotification({ isOpen: true, message: `Агент ${report.authorNickname} переведен в отдел ${report.department}.` });
                    }
                    break;
            }
            if (notificationText) {
                setNotifications(prev => [...prev, { id: Date.now(), recipientId: authorId, text: notificationText, type: 'personal', read: false, date: new Date().toISOString(), link: TABS.PROFILE }]);
            }
        } else { // Rejected
            const typeText = report.type === 'promotion' ? 'повышение' : report.type === 'penalty_removal' ? 'снятие наказания' : `вступление в отдел ${report.department}`;
            const notificationText = `Ваш рапорт на ${typeText} был отклонен.`;
            setNotifications(prev => [...prev, { id: Date.now(), recipientId: authorId, text: notificationText, type: 'personal', read: false, date: new Date().toISOString(), link: TABS.PROFILE }]);
            setNotification({ isOpen: true, message: `Рапорт от ${report.authorNickname} отклонен.` });
        }

        setSelectedReport(null);
    };

    const getReportTitle = (report: Report) => {
        switch(report.type) {
            case 'promotion': return 'Рапорт на повышение';
            case 'penalty_removal': return 'Рапорт на снятие наказания';
            case 'department_join': return `Рапорт на вступление в отдел ${report.department}`;
            default: return 'Рапорт';
        }
    }

    return (
        <div>
            <h1 className="page-title">Рапорты на рассмотрение</h1>
            <div className="content-list">
                {pendingReports.length > 0 ? pendingReports.map(report => (
                    <div key={report.id} className="content-item" onClick={() => setSelectedReport(report)}>
                        <h3 className="content-item-title">{getReportTitle(report)}</h3>
                        <p className="content-item-meta">Автор: {report.authorNickname} | Дата: {new Date(report.date).toLocaleString()}</p>
                    </div>
                )) : (
                    <p>Нет рапортов, ожидающих рассмотрения.</p>
                )}
            </div>
            <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Рассмотрение рапорта">
                {selectedReport && (
                    <div>
                        <p><strong>Автор:</strong> {selectedReport.authorNickname}</p>
                        <p><strong>Тип:</strong> {getReportTitle(selectedReport)}</p>
                        <p><strong>Дата подачи:</strong> {new Date(selectedReport.date).toLocaleString()}</p>
                        
                        {(() => {
                            const probation = getProbationForReport(selectedReport);
                            return probation ? <p className="probation-period">{probation}</p> : null;
                        })()}

                        <div className="content-detail-body" style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.content}</div>
                        <div className="form-actions">
                            <button className="button success" onClick={() => handleReview(selectedReport.id, 'approved')}>Одобрить</button>
                            <button className="button danger" onClick={() => handleReview(selectedReport.id, 'rejected')}>Отклонить</button>
                        </div>
                    </div>
                )}
            </Modal>
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