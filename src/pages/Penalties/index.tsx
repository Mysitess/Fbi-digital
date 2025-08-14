import React, { useState, useEffect } from 'react';
import './index.css';
import { ROLES } from '../../utils/constants';
import type { User, PenaltySystem, Report } from '../../utils/types';
import { Modal } from '../../components/Modal';

interface PenaltiesPageProps {
    currentUser: User;
    penaltySystem: PenaltySystem;
    onSave: (newSystem: PenaltySystem) => void;
    setReports: (updater: (prev: Report[]) => Report[]) => void;
}

export const PenaltiesPage = ({ currentUser, penaltySystem, onSave, setReports }: PenaltiesPageProps) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [reportData, setReportData] = useState({ statsLink: '', membersLink: '', content: '' });
    const [notification, setNotification] = useState({ isOpen: false, message: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editableSystem, setEditableSystem] = useState(JSON.parse(JSON.stringify(penaltySystem)));

    const canEdit = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(currentUser.role);

    useEffect(() => {
        setEditableSystem(JSON.parse(JSON.stringify(penaltySystem)));
    }, [penaltySystem]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReportData(prev => ({...prev, [name]: value}));
    };
    
    const handleEditChange = (value: string) => {
        setEditableSystem(prev => ({
            ...prev,
            requirements: value.split('\n')
        }));
    };

    const handleSaveEdits = () => {
        onSave(editableSystem);
        setIsEditing(false);
    };

    const handleSubmitReport = () => {
        if (!reportData.statsLink || !reportData.membersLink || !reportData.content) {
            setNotification({ isOpen: true, message: "Все поля должны быть заполнены." });
            return;
        }

        const formattedContent = `
прошу руководство ФБР рассмотреть мое заявление на снятие дисциплинарного взыскания, в своем отчете прикладываю следующее:
Ксерокопия выписки из мэрии [ /stats + /time]: ${reportData.statsLink}
Выписка списка сотрудников [/members + /time]: ${reportData.membersLink}

Мною была проделана следующая работа:
${reportData.content}
        `.trim();

        const newReport: Report = {
            id: Date.now(),
            authorId: currentUser.id,
            authorNickname: currentUser.nickname,
            type: 'penalty_removal',
            content: formattedContent,
            status: 'pending',
            date: new Date().toISOString(),
        };
        setReports(prev => [...prev, newReport]);
        setReportData({ statsLink: '', membersLink: '', content: '' });
        setModalOpen(false);
        setNotification({ isOpen: true, message: "Рапорт на снятие наказания успешно подан." });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Снятие Наказаний</h1>
                <div>
                     {canEdit && (
                        <button className="button warning" onClick={() => isEditing ? handleSaveEdits() : setIsEditing(true)}>
                            {isEditing ? 'Сохранить изменения' : 'Редактировать'}
                        </button>
                    )}
                    {isEditing && <button className="button" style={{marginLeft: '10px'}} onClick={() => setIsEditing(false)}>Отмена</button>}
                    <button className="button" style={{marginLeft: '10px'}} onClick={() => setModalOpen(true)}>Подать рапорт на снятие</button>
                </div>
            </div>
            <div className="rank-block">
                <h3 className="rank-title">{isEditing ? editableSystem.title : penaltySystem.title}</h3>
                {isEditing ? (
                    <textarea 
                        className="editable-reqs"
                        value={editableSystem.requirements.join('\n')}
                        onChange={(e) => handleEditChange(e.target.value)}
                        rows={penaltySystem.requirements.length + 2}
                    />
                ) : (
                    <ul className="rank-requirements">
                        {penaltySystem.requirements.map((req, index) => <li key={index}>{req}</li>)}
                    </ul>
                )}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Рапорт на снятие наказания">
                <div className="form">
                    <div className="form-group">
                        <label>Ксерокопия выписки из мэрии [ /stats + /time]</label>
                        <input name="statsLink" type="text" placeholder="Ссылка" value={reportData.statsLink} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Выписка списка сотрудников [/members + /time]</label>
                        <input name="membersLink" type="text" placeholder="Ссылка" value={reportData.membersLink} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Мною была проделана следующая работа:</label>
                        <textarea 
                            name="content"
                            placeholder="Опишите проделанную работу для снятия взыскания и приложите доказательства..."
                            value={reportData.content} 
                            onChange={handleInputChange} 
                            rows={8}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button className="button" onClick={handleSubmitReport}>Отправить</button>
                    </div>
                </div>
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
