import React from 'react';
import { ContentPage } from '../../components/ContentPage';
import { TABS } from '../../utils/constants';
import type { NewsItem, User } from '../../utils/types';

interface NewsArchivePageProps {
    archivedNews: NewsItem[];
    currentUser: User;
}

export const NewsArchivePage = ({ archivedNews, currentUser }: NewsArchivePageProps) => {
    return (
        <ContentPage
            title={TABS.NEWS_ARCHIVE}
            items={archivedNews}
            setItems={() => {}} // Not editable
            currentUser={currentUser}
            canCreate={false}
            itemType="архивную новость"
        />
    );
};
