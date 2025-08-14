import React, { useState, useEffect } from 'react';
import './index.css';
import { TABS, ROLES } from '../../utils/constants';
import type { User } from '../../utils/types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    loggedInUser: User;
    setSelectedDepartment: (department: string) => void;
    selectedDepartment: string | null;
    departments: { [key: string]: string };
    onJoinDepartmentRequest: (departmentKey: string) => void;
}

export const Sidebar = ({ activeTab, setActiveTab, loggedInUser, setSelectedDepartment, selectedDepartment, departments, onJoinDepartmentRequest }: SidebarProps) => {
    const isNewsSectionActive = activeTab === TABS.NEWS || activeTab === TABS.NEWS_ARCHIVE;
    const isRosterSectionActive = activeTab === TABS.ROSTER || activeTab === TABS.DEPARTMENT_ROSTER;
    const isReportsSectionActive = activeTab === TABS.REPORTS_REVIEW || activeTab === TABS.REPORTS_ARCHIVE;

    const [isRosterOpen, setRosterOpen] = useState(isRosterSectionActive);
    const [isNewsOpen, setNewsOpen] = useState(isNewsSectionActive);
    const [isReportsOpen, setReportsOpen] = useState(isReportsSectionActive);
    
    useEffect(() => {
        if (isRosterSectionActive) setRosterOpen(true);
        if (isNewsSectionActive) setNewsOpen(true);
        if (isReportsSectionActive) setReportsOpen(true);
    }, [activeTab, isNewsSectionActive, isRosterSectionActive, isReportsSectionActive]);


    const canAccessAdminPanel = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(loggedInUser.role);
    const canReviewReports = [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR].includes(loggedInUser.role);

    const mainTabs = [TABS.DASHBOARD, TABS.CHAT, TABS.RAIDS, TABS.PENALTIES, TABS.PROMOTIONS, TABS.CHARTER, TABS.ADMINISTRATION, TABS.BLACKLIST];
    

    const handleDepartmentClick = (dept: string) => {
        setSelectedDepartment(dept);
        setActiveTab(TABS.DEPARTMENT_ROSTER);
    }

    const handleDropdownToggle = (setter, currentState) => {
        setter(!currentState);
    }
    
    // Departments that agents can join
    const joinableDepartments = Object.entries(departments).filter(([key]) => key !== 'MANAGEMENT' && key !== 'ACADEMY');


    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <svg className="shield-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2L2 5v6.5C2 17.2 6.3 21.5 12 23c5.7-1.5 10-5.8 10-11.5V5L12 2zm0 17.5c-3.8-1-7-4.1-7-8V6.7l7-2.1l7 2.1V11.5C19 15.4 15.8 18.5 12 19.5z"/>
                </svg>
                <div className="header-logo">
                    <div className="header-logo-main">FBI | FARAWAY</div>
                    <div className="header-logo-sub">DIGITAL COMMAND CENTER</div>
                </div>
            </div>
            <nav className="sidebar-nav">
                {mainTabs.map(tab => (
                    <button key={tab} className={`nav-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab}
                    </button>
                ))}

                <div className="nav-item-with-dropdown">
                    <button className={`nav-button ${isRosterSectionActive ? 'active' : ''}`} onClick={() => handleDropdownToggle(setRosterOpen, isRosterOpen)} aria-expanded={isRosterOpen}>
                        <span>Состав ФБР</span>
                        <span className={`chevron ${isRosterOpen ? 'open' : ''}`} aria-hidden="true">›</span>
                    </button>
                    <div className={`nav-dropdown-content ${isRosterOpen ? 'open' : ''}`}>
                        <button className={`nav-button dropdown-item ${activeTab === TABS.ROSTER ? 'active' : ''}`} onClick={() => setActiveTab(TABS.ROSTER)}>
                            {TABS.ROSTER}
                        </button>
                         {joinableDepartments.map(([key, name]) => (
                             <div key={key} className="department-item-container">
                                <button
                                    className={`nav-button dropdown-item ${activeTab === TABS.DEPARTMENT_ROSTER && selectedDepartment === name ? 'active' : ''}`}
                                    onClick={() => handleDepartmentClick(name)}
                                    title={`Перейти к составу отдела ${name}`}
                                >
                                    Отдел {name}
                                </button>
                                {name !== 'Free Agents' && (
                                    <button
                                        className="join-dept-button"
                                        title={`Подать рапорт на вступление в отдел ${name}`}
                                        onClick={(e) => { e.stopPropagation(); onJoinDepartmentRequest(key); }}
                                    >
                                        Вступить
                                    </button>
                                )}
                             </div>
                        ))}
                    </div>
                </div>

                <div className="nav-item-with-dropdown">
                    <button className={`nav-button ${isNewsSectionActive ? 'active' : ''}`} onClick={() => handleDropdownToggle(setNewsOpen, isNewsOpen)} aria-expanded={isNewsOpen}>
                        <span>{TABS.NEWS}</span>
                        <span className={`chevron ${isNewsOpen ? 'open' : ''}`} aria-hidden="true">›</span>
                    </button>
                    <div className={`nav-dropdown-content ${isNewsOpen ? 'open' : ''}`}>
                        <button className={`nav-button dropdown-item ${activeTab === TABS.NEWS ? 'active' : ''}`} onClick={() => setActiveTab(TABS.NEWS)}>
                            Основная лента
                        </button>
                        <button className={`nav-button dropdown-item ${activeTab === TABS.NEWS_ARCHIVE ? 'active' : ''}`} onClick={() => setActiveTab(TABS.NEWS_ARCHIVE)}>
                            {TABS.NEWS_ARCHIVE}
                        </button>
                    </div>
                </div>

                {canReviewReports && (
                    <div className="nav-item-with-dropdown">
                        <button className={`nav-button ${isReportsSectionActive ? 'active' : ''}`} onClick={() => handleDropdownToggle(setReportsOpen, isReportsOpen)} aria-expanded={isReportsOpen}>
                            <span>Рапорты</span>
                            <span className={`chevron ${isReportsOpen ? 'open' : ''}`} aria-hidden="true">›</span>
                        </button>
                        <div className={`nav-dropdown-content ${isReportsOpen ? 'open' : ''}`}>
                             <button className={`nav-button dropdown-item ${activeTab === TABS.REPORTS_REVIEW ? 'active' : ''}`} onClick={() => setActiveTab(TABS.REPORTS_REVIEW)}>
                                {TABS.REPORTS_REVIEW}
                            </button>
                             <button className={`nav-button dropdown-item ${activeTab === TABS.REPORTS_ARCHIVE ? 'active' : ''}`} onClick={() => setActiveTab(TABS.REPORTS_ARCHIVE)}>
                                {TABS.REPORTS_ARCHIVE}
                            </button>
                        </div>
                    </div>
                )}


                {canAccessAdminPanel && (
                    <>
                        <button key={TABS.ADMIN_PANEL} className={`nav-button ${activeTab === TABS.ADMIN_PANEL ? 'active' : ''}`} onClick={() => setActiveTab(TABS.ADMIN_PANEL)}>
                            {TABS.ADMIN_PANEL}
                        </button>
                         <button key={TABS.AUDIT_LOG} className={`nav-button ${activeTab === TABS.AUDIT_LOG ? 'active' : ''}`} onClick={() => setActiveTab(TABS.AUDIT_LOG)}>
                            {TABS.AUDIT_LOG}
                        </button>
                    </>
                )}
            </nav>
        </aside>
    );
};