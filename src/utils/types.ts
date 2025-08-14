export interface Penalty {
    type: string;
    reason: string;
    givenBy: string;
}

export interface User {
    id: number;
    nickname: string;
    password?: string | null;
    rank: number;
    role: string;
    position: string;
    department: string;
    onDuty: boolean;
    penalties: Penalty[];
    lastPromotionDate: string | null;
    isHead?: boolean;
    departmentHistory: string[];
}

export interface Comment {
    author: string;
    text: string;
}

export interface ContentItem {
    id: number | string;
    title: string;
    author: string;
    date: string;
    pinned: boolean;
    comments: Comment[];
    content: string;
}

export interface RaidItem extends ContentItem {}

export interface NewsItem extends ContentItem {}

export interface Report {
    id: number;
    authorId: number;
    authorNickname: string;
    type: 'promotion' | 'penalty_removal' | 'department_join';
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    reviewerNickname?: string;
    reviewDate?: string;
    department?: string;
    isFirstDepartmentRequest?: boolean;
    archiveId?: string;
}

export interface Notification {
    id: number;
    recipientId: number | null; // null for global
    text: string;
    type: 'global' | 'personal';
    read: boolean;
    date: string;
    link?: string;
}

export interface ChatMessage {
    id: number;
    author: string;
    text: string;
    timestamp: string;
}

export interface Chats {
    general: ChatMessage[];
    [key: string]: ChatMessage[];
}

export interface PromotionSystem {
    academyTitle: string;
    academyData: { title: string; reqs: string[] }[];
    agentsTitle: string;
    agentPromotions: { rank: string; reqs:string[]; probation: string | null }[];
    tasksA: string[];
    tasksC: string[];
    tasksS: string[];
}

export interface PenaltySystem {
    title: string;
    requirements: string[];
}

export interface BlacklistedPerson {
    id: number;
    nickname: string;
    reason: string;
    term: string;
    issuerNickname: string;
    date: string;
}

export interface AuditLogItem {
    id: number;
    date: string;
    userNickname: string;
    action: string;
    details: string;
}

export interface AppData {
    users: User[];
    rankNames: string[];
    departments: { [key: string]: string };
    news: NewsItem[];
    archivedNews: NewsItem[];
    raids: RaidItem[];
    reports: Report[];
    notifications: Notification[];
    chats: Chats;
    charterText: string;
    penaltySystem: PenaltySystem;
    promotionSystem: PromotionSystem;
    blacklist: BlacklistedPerson[];
    archivedReports: Report[];
    auditLog: AuditLogItem[];
}