import React from 'react';
import { ContentPage } from '../../components/ContentPage';
import { TABS } from '../../utils/constants';
import type { RaidItem, User } from '../../utils/types';

interface RaidsPageProps {
    raids: RaidItem[];
    setRaids: (updater: (prev: RaidItem[]) => RaidItem[]) => void;
    currentUser: User;
    addAuditLog: (action: string, details: string) => void;
}

export const RaidsPage = ({ raids, setRaids, currentUser, addAuditLog }: RaidsPageProps) => {
    return (
        <ContentPage
            title={TABS.RAIDS}
            items={raids}
            setItems={setRaids}
            currentUser={currentUser}
            canCreate={true}
            itemType="облаву"
            addAuditLog={addAuditLog}
        />
    );
};