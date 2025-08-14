import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { ROLES } from '../../utils/constants';
import type { User, PromotionSystem, Report } from '../../utils/types';
import { Modal } from '../../components/Modal';

interface PromotionsPageProps {
    currentUser: User;
    setReports: (updater: (prev: Report[]) => Report[]) => void;
    promotionSystem: PromotionSystem;
    onSave: (newSystem: PromotionSystem) => void;
    rankNames: string[];
}

const parseProbationHours = (probationString: string | null) => {
    if (!probationString) return 0;
    const match = probationString.match(/\[(\d+)\s*часа?о?в?\]/);
    return match ? parseInt(match[1], 10) : 0;
};


export const PromotionsPage = ({ currentUser, setReports, promotionSystem, onSave, rankNames }: PromotionsPageProps) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [reportData, setReportData] = useState({ statsLink: '', progressLink: '', membersLink: '', content: '' });
    const [notification, setNotification] = useState({ isOpen: false, message: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editableSystem, setEditableSystem] = useState<PromotionSystem>(JSON.parse(JSON.stringify(promotionSystem))); // Deep copy
    const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', onConfirm: () => {} });

    // Drag and Drop state
    const draggedItem = useRef<{type: string, index: number} | null>(null);
    const draggedOverItem = useRef<{type: string, index: number} | null>(null);
    
    const canEdit = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(currentUser.role);

    useEffect(() => {
        if (!isEditing) {
            setEditableSystem(JSON.parse(JSON.stringify(promotionSystem)));
        }
    }, [promotionSystem, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReportData(prev => ({...prev, [name]: value}));
    }

    const handleEditChange = (type: 'academyData' | 'agentPromotions', index: number, field: string, value: string) => {
        setEditableSystem(prev => {
            const list = [...prev[type]];
            const item = { ...list[index] };

            if (field === 'reqs') item.reqs = value.split('\n');
            else item[field] = value;
            
            list[index] = item;
            return { ...prev, [type]: list };
        });
    };

    const handleTasksChange = (type: 'tasksA' | 'tasksC' | 'tasksS', value: string) => {
        setEditableSystem(prev => ({
            ...prev,
            [type]: value.split('\n')
        }));
    };
    
    const handleTitleChange = (field: 'academyTitle' | 'agentsTitle', value: string) => {
        setEditableSystem(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddItem = (type: 'academyData' | 'agentPromotions') => {
        setEditableSystem(prev => {
            if (type === 'academyData') {
                const newItem = { title: "Новое правило академии", reqs: ["Новое требование..."] };
                return { ...prev, academyData: [...prev.academyData, newItem] };
            }
            const newItem = { rank: "Новое правило повышения", reqs: ["Новое требование..."], probation: "Испытательный срок [24 часа]" };
            return { ...prev, agentPromotions: [...prev.agentPromotions, newItem] };
        });
    };

    const handleDeleteItem = (type: 'academyData' | 'agentPromotions', index: number) => {
        setConfirmation({
            isOpen: true,
            message: 'Вы уверены, что хотите удалить этот критерий?',
            onConfirm: () => {
                setEditableSystem(prev => {
                    const list = [...prev[type]];
                    list.splice(index, 1);
                    return { ...prev, [type]: list };
                });
                setConfirmation({isOpen: false, message: '', onConfirm: () => {}});
            }
        })
    };
    
    const handleDragSort = () => {
        if (!draggedItem.current || !draggedOverItem.current || draggedItem.current.type !== draggedOverItem.current.type) return;

        const { type, index: fromIndex } = draggedItem.current;
        const { index: toIndex } = draggedOverItem.current;

        if (fromIndex === toIndex) return;

        setEditableSystem(prev => {
            const list = [...prev[type]];
            const item = list.splice(fromIndex, 1)[0];
            list.splice(toIndex, 0, item);
            return { ...prev, [type]: list };
        });

        draggedItem.current = null;
        draggedOverItem.current = null;
    };


    const handleSaveEdits = () => {
        onSave(editableSystem);
        setIsEditing(false);
    }

    const handleCancelEdits = () => {
        setEditableSystem(JSON.parse(JSON.stringify(promotionSystem)));
        setIsEditing(false);
    }

    const handleSubmitReport = () => {
        if (currentUser.lastPromotionDate) {
            const agentCurrentRank = currentUser.rank;
            const promotionRuleIndex = agentCurrentRank - 3; // agentPromotions starts from rank 4
            if (promotionSystem.agentPromotions[promotionRuleIndex]) {
                const probationString = promotionSystem.agentPromotions[promotionRuleIndex].probation;
                const cooldownHours = parseProbationHours(probationString);
                if (cooldownHours > 0) {
                    const lastPromoTime = new Date(currentUser.lastPromotionDate).getTime();
                    const cooldownMillis = cooldownHours * 60 * 60 * 1000;
                    if (Date.now() - lastPromoTime < cooldownMillis) {
                        setNotification({isOpen: true, message: `Вы не можете подать рапорт. Испытательный срок еще не прошел. Осталось примерно ${Math.ceil((cooldownMillis - (Date.now() - lastPromoTime)) / (1000 * 60 * 60))} часов.`});
                        return;
                    }
                }
            }
        }

        if (!reportData.statsLink || !reportData.progressLink || !reportData.membersLink || !reportData.content) {
            setNotification({ isOpen: true, message: "Все поля должны быть заполнены." });
            return;
        }
        const formattedContent = `
прошу руководство Бюро рассмотреть мое заявление на повышение, в своем отчете прикладываю следующее:
Ксерокопия выписки из мэрии [ /stats + /time]: ${reportData.statsLink}
Ксерокопия личного дела [ /jobprogress + /time]: ${reportData.progressLink}
Выписка списка сотрудников [/members + /time]: ${reportData.membersLink}

Мною была проделана следующая работа:
${reportData.content}
        `.trim();

        const newReport: Report = {
            id: Date.now(),
            authorId: currentUser.id,
            authorNickname: currentUser.nickname,
            type: 'promotion',
            content: formattedContent,
            status: 'pending',
            date: new Date().toISOString(),
        };
        setReports(prev => [...prev, newReport]);
        setReportData({ statsLink: '', progressLink: '', membersLink: '', content: '' });
        setModalOpen(false);
        setNotification({ isOpen: true, message: "Рапорт на повышение успешно подан." });
    };
    
    const { academyTitle, academyData, agentsTitle, agentPromotions, tasksA, tasksC, tasksS } = isEditing ? editableSystem : promotionSystem;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Система Повышения</h1>
                <div className="form-actions" style={{marginTop: 0}}>
                     {canEdit && (
                        <button className="button warning" onClick={() => isEditing ? handleSaveEdits() : setIsEditing(true)}>
                            {isEditing ? 'Сохранить изменения' : 'Редактировать'}
                        </button>
                    )}
                    {isEditing && <button className="button" onClick={handleCancelEdits}>Отмена</button>}
                    {!isEditing && <button className="button" onClick={() => setModalOpen(true)}>Подать рапорт</button>}
                </div>
            </div>
            
            <div className="promotions-grid">
                <div className={`rank-block ${isEditing ? 'is-editing' : ''}`}>
                    {isEditing ? (
                         <div className="rank-title-container">
                            <input 
                                className="rank-title-input"
                                value={academyTitle}
                                onChange={(e) => handleTitleChange('academyTitle', e.target.value)}
                            />
                        </div>
                    ) : (
                        <h2 className="rank-title">{academyTitle}</h2>
                    )}
                </div>
                {academyData.map((r, index) => (
                    <div 
                        key={index}
                        className={`rank-block ${isEditing ? 'is-editing' : ''} ${draggedItem.current?.index === index && draggedItem.current?.type === 'academyData' ? 'dragging' : ''}`}
                        draggable={isEditing}
                        onDragStart={() => isEditing && (draggedItem.current = {type: 'academyData', index})}
                        onDragEnter={() => isEditing && (draggedOverItem.current = {type: 'academyData', index})}
                        onDragEnd={handleDragSort}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {isEditing && (
                            <div className="block-actions">
                                <span className="drag-handle" title="Перетащить">☰</span>
                                <button onClick={() => handleDeleteItem('academyData', index)} className="delete-btn" title="Удалить критерий">×</button>
                            </div>
                        )}
                        {isEditing ? (
                            <input 
                                className="rank-title-input"
                                value={r.title}
                                onChange={(e) => handleEditChange('academyData', index, 'title', e.target.value)}
                            />
                        ) : (
                            <h3 className="rank-title">{r.title}</h3>
                        )}
                        {isEditing ? (
                             <textarea 
                                className="editable-reqs"
                                value={r.reqs.join('\n')}
                                onChange={(e) => handleEditChange('academyData', index, 'reqs', e.target.value)}
                                rows={r.reqs.length + 1}
                            />
                        ) : (
                            <ul className="rank-requirements">
                                {r.reqs.map((req, i) => <li key={i}>{req}</li>)}
                            </ul>
                        )}
                    </div>
                ))}
                 {isEditing && (
                    <button className="button success add-item-button" onClick={() => handleAddItem('academyData')}>
                        + Добавить правило в академию
                    </button>
                )}

                <div className={`rank-block ${isEditing ? 'is-editing' : ''}`} style={{marginTop: '20px'}}>
                     {isEditing ? (
                        <div className="rank-title-container">
                           <input 
                               className="rank-title-input"
                               value={agentsTitle}
                               onChange={(e) => handleTitleChange('agentsTitle', e.target.value)}
                           />
                       </div>
                   ) : (
                       <h2 className="rank-title">{agentsTitle}</h2>
                   )}
                </div>
                {agentPromotions.map((r, index) => (
                    <div 
                        key={index} 
                        className={`rank-block ${isEditing ? 'is-editing' : ''} ${draggedItem.current?.index === index && draggedItem.current?.type === 'agentPromotions' ? 'dragging' : ''}`}
                        draggable={isEditing}
                        onDragStart={() => isEditing && (draggedItem.current = {type: 'agentPromotions', index})}
                        onDragEnter={() => isEditing && (draggedOverItem.current = {type: 'agentPromotions', index})}
                        onDragEnd={handleDragSort}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {isEditing && (
                             <div className="block-actions">
                                <span className="drag-handle" title="Перетащить">☰</span>
                                <button onClick={() => handleDeleteItem('agentPromotions', index)} className="delete-btn" title="Удалить критерий">×</button>
                            </div>
                        )}
                        {isEditing ? (
                            <input
                                className="rank-title-input"
                                value={r.rank}
                                onChange={(e) => handleEditChange('agentPromotions', index, 'rank', e.target.value)}
                            />
                        ) : (
                            <h3 className="rank-title">{r.rank}</h3>
                        )}
                         {isEditing ? (
                             <textarea 
                                className="editable-reqs"
                                value={r.reqs.join('\n')}
                                onChange={(e) => handleEditChange('agentPromotions', index, 'reqs', e.target.value)}
                                rows={r.reqs.length + 1}
                            />
                        ) : (
                            <ul className="rank-requirements">
                                {r.reqs.map((req, i) => <li key={i}>{req}</li>)}
                            </ul>
                        )}
                        {isEditing ? (
                            <input
                                className="probation-input"
                                value={r.probation || ''}
                                placeholder="Испытательный срок..."
                                onChange={(e) => handleEditChange('agentPromotions', index, 'probation', e.target.value)}
                            />
                        ) : (
                           r.probation && <p className="probation-period">{r.probation}</p>
                        )}
                    </div>
                ))}
                 {isEditing && (
                    <button className="button success add-item-button" onClick={() => handleAddItem('agentPromotions')}>
                        + Добавить критерий повышения
                    </button>
                )}
            </div>

            <h2 className="page-title" style={{marginTop: '40px'}}>Списки Заданий</h2>
            <div className="roster-grid">
                 <div className="rank-block">
                    <h3 className="rank-title">Задания A уровня</h3>
                     {isEditing ? (
                         <textarea 
                            className="editable-reqs"
                            value={tasksA.join('\n')}
                            onChange={(e) => handleTasksChange('tasksA', e.target.value)}
                            rows={tasksA.length + 1}
                         />
                     ) : <ul className="rank-requirements">{tasksA.map((t, i) => <li key={i}>{t}</li>)}</ul>}
                </div>
                <div className="rank-block">
                    <h3 className="rank-title">Задания C уровня</h3>
                     {isEditing ? (
                         <textarea 
                            className="editable-reqs"
                            value={tasksC.join('\n')}
                            onChange={(e) => handleTasksChange('tasksC', e.target.value)}
                             rows={tasksC.length + 1}
                         />
                     ) : <ul className="rank-requirements">{tasksC.map((t, i) => <li key={i}>{t}</li>)}</ul>}
                </div>
                <div className="rank-block">
                    <h3 className="rank-title">Задания S уровня</h3>
                     {isEditing ? (
                         <textarea 
                            className="editable-reqs"
                            value={tasksS.join('\n')}
                            onChange={(e) => handleTasksChange('tasksS', e.target.value)}
                             rows={tasksS.length + 1}
                         />
                     ) : <ul className="rank-requirements">{tasksS.map((t, i) => <li key={i}>{t}</li>)}</ul>}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Подать рапорт на повышение">
                <div className="form">
                    <div className="form-group">
                        <label>Ксерокопия выписки из мэрии [ /stats + /time]</label>
                        <input name="statsLink" type="text" placeholder="Ссылка" value={reportData.statsLink} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group">
                        <label>Ксерокопия личного дела [ /jobprogress + /time]</label>
                        <input name="progressLink" type="text" placeholder="Ссылка" value={reportData.progressLink} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group">
                         <label>Выписка списка сотрудников [/members + /time]</label>
                        <input name="membersLink" type="text" placeholder="Ссылка" value={reportData.membersLink} onChange={handleInputChange} required/>
                    </div>
                    <div className="form-group">
                        <label>Мною была проделана следующая работа:</label>
                        <textarea 
                            name="content"
                            placeholder="Опишите свои достижения и выполненные задания..."
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
             <Modal isOpen={confirmation.isOpen} onClose={() => setConfirmation({ isOpen: false, message: '', onConfirm: () => {} })} title="Подтверждение">
                <div>
                    <p>{confirmation.message}</p>
                    <div className="form-actions">
                        <button className="button danger" onClick={confirmation.onConfirm}>Удалить</button>
                        <button className="button" onClick={() => setConfirmation({ isOpen: false, message: '', onConfirm: () => {} })}>Отмена</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
