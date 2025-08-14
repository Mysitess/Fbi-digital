import React, { useState, useEffect } from 'react';
import './index.css';
import { Modal } from '../Modal';
import { ROLES } from '../../utils/constants';
import type { User, ContentItem } from '../../utils/types';

interface ContentPageProps {
    title: string;
    items: ContentItem[];
    setItems: (updater: (prev: ContentItem[]) => ContentItem[]) => void;
    currentUser: User;
    canCreate: boolean;
    itemType: string;
    onArchiveItem?: ((id: number | string) => void) | null;
    initialItemToOpen?: number | string | null;
    onItemOpened?: () => void;
    addAuditLog?: (action: string, details: string) => void;
}

export const ContentPage = ({ title, items, setItems, currentUser, canCreate, itemType, onArchiveItem = null, initialItemToOpen, onItemOpened, addAuditLog }: ContentPageProps) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
    const [commentText, setCommentText] = useState('');
    const [editModeItem, setEditModeItem] = useState<ContentItem | null>(null);

    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmButtonText: 'Подтвердить',
        confirmButtonClass: ''
    });

    useEffect(() => {
        if (initialItemToOpen && items && onItemOpened) {
            const item = items.find(i => i.id === initialItemToOpen);
            if (item) {
                setSelectedItem(item);
                onItemOpened(); // Clear the state in App.tsx
            }
        }
    }, [initialItemToOpen, items, onItemOpened]);


    const canManage = currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.DIRECTOR;
    
    const resetAndCloseCreateModal = () => {
        setCreateModalOpen(false);
        setNewItemTitle('');
        setNewItemContent('');
        setEditModeItem(null);
    }

    const closeConfirmation = () => {
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmButtonText: 'Подтвердить', confirmButtonClass: '' });
    };
    
    const handleSaveItem = () => {
        if (!newItemTitle || !newItemContent) return;

        if (editModeItem) {
            const updatedItem = { ...editModeItem, title: newItemTitle, content: newItemContent };
            setItems(prev => prev.map(item => item.id === editModeItem.id ? updatedItem : item));
            if (selectedItem?.id === editModeItem.id) {
                setSelectedItem(updatedItem);
            }
            if(addAuditLog) addAuditLog(`Редактирование: ${itemType}`, `Заголовок: "${newItemTitle}"`);
        } else {
            const newItem: ContentItem = {
                id: Date.now(),
                title: newItemTitle,
                content: newItemContent,
                author: currentUser.nickname,
                date: new Date().toISOString(),
                pinned: false,
                comments: []
            };
            setItems(prev => [newItem, ...prev]);
            if(addAuditLog) addAuditLog(`Создание: ${itemType}`, `Заголовок: "${newItemTitle}"`);
        }
        
        resetAndCloseCreateModal();
    };

    const handleOpenEditModal = () => {
        if(!selectedItem) return;
        setEditModeItem(selectedItem);
        setNewItemTitle(selectedItem.title);
        setNewItemContent(selectedItem.content);
        setCreateModalOpen(true);
    };

    const handleDelete = (id: number | string) => {
        const itemToDelete = items.find(item => item.id === id);
        setConfirmation({
            isOpen: true,
            title: 'Подтверждение удаления',
            message: `Вы уверены, что хотите удалить этот ${itemType}? Это действие необратимо.`,
            onConfirm: () => {
                setItems(prev => prev.filter(item => item.id !== id));
                if(addAuditLog && itemToDelete) addAuditLog(`Удаление: ${itemType}`, `Заголовок: "${itemToDelete.title}"`);
                setSelectedItem(null);
                closeConfirmation();
            },
            confirmButtonText: 'Удалить',
            confirmButtonClass: 'danger'
        });
    }
    
    const handleArchive = (id: number | string) => {
        setConfirmation({
            isOpen: true,
            title: 'Подтверждение архивации',
            message: `Вы уверены, что хотите архивировать этот ${itemType}?`,
            onConfirm: () => {
                if (onArchiveItem) {
                    onArchiveItem(id);
                }
                setSelectedItem(null);
                closeConfirmation();
            },
            confirmButtonText: 'Архивировать',
            confirmButtonClass: 'warning'
        });
    }

    const handlePin = (id: number | string) => {
        let pinnedStatus = false;
        setItems(prevItems => {
            const newItems = prevItems.map(item => {
                if (item.id === id) {
                    pinnedStatus = !item.pinned;
                    return {...item, pinned: pinnedStatus };
                }
                return item;
            });
            const updatedItemInModal = newItems.find(item => item.id === id);
            if (updatedItemInModal) {
                 setSelectedItem(updatedItemInModal);
                 if(addAuditLog) addAuditLog(pinnedStatus ? `Закрепление новости` : 'Открепление новости', `Заголовок: "${updatedItemInModal.title}"`);
            }
            return newItems;
        });
    }
    
    const handleAddComment = () => {
        if (!commentText || !selectedItem) return;
        const newComment = { author: currentUser.nickname, text: commentText };
        setItems(prev => prev.map(item => {
            if (item.id === selectedItem.id) {
                const updatedItem = { ...item, comments: [...(item.comments || []), newComment] };
                setSelectedItem(updatedItem); // Update the view in the modal
                return updatedItem;
            }
            return item;
        }));
        setCommentText('');
    };

    const sortedItems = items ? [...items].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    if (selectedItem) {
        return (
            <div className="content-detail-view">
                <div className="content-detail-header">
                    <div className="content-detail-info">
                        <button className="button" onClick={() => setSelectedItem(null)}>← Назад к списку</button>
                        <h1 className="page-title">{selectedItem.title}</h1>
                        <p className="content-item-meta">Автор: {selectedItem.author} | Дата: {new Date(selectedItem.date).toLocaleDateString()}</p>
                    </div>
                    <div className="content-detail-actions-inline">
                         {itemType === 'новость' && canManage && selectedItem.author !== 'Система' && (
                            <>
                                <button className="button warning" onClick={() => handlePin(selectedItem.id)}>{selectedItem.pinned ? 'Открепить' : 'Закрепить'}</button>
                                <button className="button" onClick={handleOpenEditModal}>Редактировать</button>
                                {onArchiveItem && <button className="button warning" onClick={() => handleArchive(selectedItem.id)}>Архивировать</button>}
                                <button className="button danger" onClick={() => handleDelete(selectedItem.id)}>Удалить</button>
                            </>
                        )}
                        {itemType === 'облаву' && canManage && (
                             <button className="button danger" onClick={() => handleDelete(selectedItem.id)}>Удалить</button>
                        )}
                    </div>
                </div>

                <div className="content-detail-body">{selectedItem.content}</div>

                {itemType === 'облаву' && (
                    <div className="comments-section">
                        <h3>Комментарии</h3>
                        {(selectedItem.comments || []).length > 0 ? selectedItem.comments.map((comment, i) => (
                            <div key={i} className="comment">
                                <p className="comment-author">{comment.author}</p>
                                <p>{comment.text}</p>
                            </div>
                        )) : <p>Комментариев пока нет.</p>}
                        <div className="form" style={{marginTop: '20px'}}>
                            <div className="form-group">
                                <textarea placeholder="Оставить комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                            </div>
                            <div className="form-actions">
                               <button className="button" onClick={handleAddComment}>Отправить</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }


    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{title}</h1>
                 {canCreate && <button className="button" onClick={() => { setEditModeItem(null); setCreateModalOpen(true); }}>Создать {itemType}</button>}
            </div>
            <div className="content-list">
                {sortedItems.length > 0 ? sortedItems.map(item => (
                    <div key={item.id} className={`content-item ${item.pinned ? 'pinned' : ''}`} onClick={() => setSelectedItem(item)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && setSelectedItem(item)}>
                        <div className="content-item-header">
                            <h3 className="content-item-title">
                                {item.pinned && <span aria-label="Закреплено">📌 </span>}
                                {item.title}
                            </h3>
                        </div>
                        <p className="content-item-meta">Автор: {item.author} | Дата: {new Date(item.date).toLocaleDateString()}</p>
                    </div>
                )) : <p>Здесь пока ничего нет.</p>}
            </div>
            
            {/* --- Modals --- */}
            <Modal isOpen={isCreateModalOpen} onClose={resetAndCloseCreateModal} title={editModeItem ? `Редактировать ${itemType}`: `Создать ${itemType}`}>
                <div className="form">
                    <div className="form-group">
                        <label>Заголовок</label>
                        <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Содержание</label>
                        <textarea value={newItemContent} onChange={e => setNewItemContent(e.target.value)} />
                    </div>
                    <div className="form-actions">
                        <button className="button" onClick={handleSaveItem}>{editModeItem ? 'Сохранить' : 'Создать'}</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={confirmation.isOpen} onClose={closeConfirmation} title={confirmation.title}>
                <div>
                    <p>{confirmation.message}</p>
                    <div className="form-actions">
                         <button className={`button ${confirmation.confirmButtonClass}`} onClick={confirmation.onConfirm}>
                            {confirmation.confirmButtonText}
                        </button>
                        <button className="button" onClick={closeConfirmation}>Отмена</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}