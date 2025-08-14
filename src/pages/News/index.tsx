import React from 'react';
import { ContentPage } from '../../components/ContentPage';
import { TABS, ROLES } from '../../utils/constants';
import type { NewsItem, User } from '../../utils/types';

interface NewsPageProps {
    news: NewsItem[];
    setNews: (updater: (prev: NewsItem[]) => NewsItem[]) => void;
    handleArchiveNews: (id: number | string) => void;
    currentUser: User;
    initialItemToOpen: number | string | null;
    onItemOpened: () => void;
    addAuditLog: (action: string, details: string) => void;
}

export const NewsPage = ({ news, setNews, handleArchiveNews, currentUser, initialItemToOpen, onItemOpened, addAuditLog }: NewsPageProps) => {
    return (
        <ContentPage 
            title={TABS.NEWS} 
            items={news} 
            setItems={setNews} 
            onArchiveItem={handleArchiveNews} 
            currentUser={currentUser} 
            canCreate={currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.DIRECTOR} 
            itemType="новость" 
            initialItemToOpen={initialItemToOpen}
            onItemOpened={onItemOpened}
            addAuditLog={addAuditLog}
        />
    );
};