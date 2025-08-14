import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import { ROLES } from '../../utils/constants';
import type { User } from '../../utils/types';
import { Widget } from '../../components/Widget';

interface CharterPageProps {
    charterText: string;
    onSave: (newText: string) => void;
    currentUser: User;
}

const renderFormattedText = (text: string) => {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    const regex = /(ГЛАВА\s[IVXLC]+\.)|(\b\d+\.\d+(\.\d+)*\b\.?)|([a-z]\))/g;
    return text.split(regex).filter(Boolean).map((part, index) => {
        if (part && part.match(regex)) {
            return <span key={index} className="charter-number">{part}</span>;
        }
        return part;
    });
};

const highlightText = (text: string, highlight: string) => {
    if (!text) return null;
    if (!highlight.trim()) {
        return renderFormattedText(text);
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    // We can't simply split by the highlight, because we need to process the other parts with renderFormattedText.
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, index) => {
                if (part.toLowerCase() === highlight.toLowerCase()) {
                    return <mark key={index}>{part}</mark>;
                }
                return renderFormattedText(part);
            })}
        </>
    );
};


export const CharterPage = ({ charterText, onSave, currentUser }: CharterPageProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableText, setEditableText] = useState(charterText);
    const [searchQuery, setSearchQuery] = useState('');
    
    const canEdit = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(currentUser.role);

    useEffect(() => {
        setEditableText(charterText);
    }, [charterText]);

    const handleSave = () => {
        onSave(editableText);
        setIsEditing(false);
    };

    const getChapterId = (title: string) => title.toLowerCase().replace(/[^a-z0-9а-яё]/g, '-');
    
    const chapters = useMemo(() => {
        const chapterRegex = /(ГЛАВА [IVXLC]+\. [^\n]+)/g;
        const rawParts = charterText.trim().split(chapterRegex).filter(p => p && p.trim() !== '');
        
        const structuredChapters: {title: string, content: string}[] = [];
        for (let i = 0; i < rawParts.length; i += 2) {
            if (rawParts[i] && rawParts[i+1]) {
                structuredChapters.push({
                    title: rawParts[i],
                    content: rawParts[i+1].trim()
                });
            }
        }
        return structuredChapters;
    }, [charterText]);

    const hasMatches = useMemo(() => {
        if (!searchQuery.trim()) return true; // No search means "all matches"
        return charterText.toLowerCase().includes(searchQuery.toLowerCase());
    }, [charterText, searchQuery]);

    return (
        <div>
             <div className="page-header">
                <h1 className="page-title">Устав Федерального Бюро Расследований</h1>
                <div>
                     {canEdit && !isEditing && (
                        <button className="button warning" onClick={() => setIsEditing(true)}>
                            Редактировать
                        </button>
                    )}
                </div>
            </div>
            {isEditing ? (
                 <div className="form">
                    <textarea 
                        className="editable-reqs"
                        value={editableText}
                        onChange={(e) => setEditableText(e.target.value)}
                        style={{ height: '70vh', fontFamily: 'monospace' }}
                    />
                    <div className="form-actions">
                        <button className="button" onClick={handleSave}>Сохранить</button>
                        <button className="button" onClick={() => setIsEditing(false)}>Отмена</button>
                    </div>
                </div>
            ) : (
                <div className="charter-page-layout">
                    <aside className="charter-sidebar">
                        <div className="charter-search">
                            <input
                                type="text"
                                placeholder="Поиск по уставу..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Widget title="Содержание">
                            <nav className="charter-toc">
                                <ul>
                                    {chapters.map((chapter) => {
                                        const id = getChapterId(chapter.title);
                                        return (
                                        <li key={id}>
                                            <a href={`#${id}`} onClick={(e) => { e.preventDefault(); const element = document.getElementById(id); if (element) element.scrollIntoView({ behavior: 'smooth' }); }}>
                                                {renderFormattedText(chapter.title)}
                                            </a>
                                        </li>
                                    )})}
                                </ul>
                            </nav>
                        </Widget>
                    </aside>
                    <main className="charter-main-content">
                        <p>Автор: Paradise Killa</p>
                        <div className="charter-content">
                            {chapters.map(chapter => {
                                const id = getChapterId(chapter.title);
                                return (
                                    <section key={id} id={id}>
                                        <h2>{highlightText(chapter.title, searchQuery)}</h2>
                                        <p style={{whiteSpace: 'pre-line'}}>{highlightText(chapter.content, searchQuery)}</p>
                                    </section>
                                );
                            })}
                            {!hasMatches && <p>По вашему запросу ничего не найдено.</p>}
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
};