export const TABS = {
  DASHBOARD: 'Главная',
  PROFILE: 'Мой профиль',
  ROSTER: 'Общий состав',
  DEPARTMENT_ROSTER: 'Состав Отдела',
  CHAT: 'Чат',
  NEWS: 'Новости',
  NEWS_ARCHIVE: 'Архив новостей',
  RAIDS: 'Облавы',
  PENALTIES: 'Снятие наказаний',
  PROMOTIONS: 'Система повышения',
  CHARTER: 'Устав ФБР',
  ADMINISTRATION: 'Администрация',
  ADMIN_PANEL: 'Админ-панель',
  REPORTS_REVIEW: 'Рапорты на рассмотрение',
  REPORTS_ARCHIVE: 'Архив рапортов',
  BLACKLIST: 'ЧС ФБР',
  AUDIT_LOG: 'Журнал аудита',
};

export const ROLES = {
  ADMIN: 'Администратор',
  DIRECTOR: 'Директор ФБР',
  DEPUTY_DIRECTOR: 'Зам. Директора ФБР',
  AGENT: 'Агент'
};

export const PENALTY_TYPE = "Строгий выговор";

export const getRoleFromRank = (rankIndex: number): string => {
    switch (rankIndex) {
        case 9: return ROLES.DIRECTOR;
        case 8: return ROLES.DEPUTY_DIRECTOR;
        default: return ROLES.AGENT;
    }
};