import React, { useState } from 'react';
import './index.css';
import type { User } from '../../utils/types';

interface LoginScreenProps {
    onLogin: (user: User) => void;
    users: User[];
    setUsers: (updater: (prev: User[]) => User[]) => void;
}

export const LoginScreen = ({ onLogin, users, setUsers }: LoginScreenProps) => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState('enterNick'); // 'enterNick', 'createPass', 'enterPass'
    const [userForSetup, setUserForSetup] = useState<User | null>(null);

    const resetState = () => {
        setNickname('');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setStep('enterNick');
        setUserForSetup(null);
    }

    const handleNickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase());
        if (!user) {
            setError('Пользователь не найден в белом списке.');
            return;
        }
        setUserForSetup(user);
        if (user.password === null) {
            setStep('createPass');
        } else {
            setStep('enterPass');
        }
        setError('');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userForSetup && userForSetup.password === password) {
            onLogin(userForSetup);
        } else {
            setError('Неверный пароль.');
        }
    };
    
    const handleCreatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
             setError('Пароль должен быть не менее 6 символов.');
             return;
        }
        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }
        if (!userForSetup) return;
        const updatedUser = { ...userForSetup, password: newPassword };
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        onLogin(updatedUser);
    };

    return (
        <div className="login-container">
            <h1>Digital Command Center</h1>
            {step === 'enterNick' && (
                <form onSubmit={handleNickSubmit} className="login-form">
                    <p>Введите ваш никнейм для входа или первой регистрации.</p>
                     <p>Тестовый ник без пароля: New_Agent</p>
                    <input
                        type="text"
                        className="login-input"
                        placeholder="Nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                    />
                    <button type="submit" className="login-button">Далее</button>
                </form>
            )}
             {step === 'enterPass' && userForSetup && (
                <form onSubmit={handlePasswordSubmit} className="login-form">
                    <p>Добро пожаловать, {userForSetup.nickname}! Введите пароль.</p>
                    <input
                        type="password"
                        className="login-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                     <button type="submit" className="login-button">Войти</button>
                     <button type="button" className="link-button" onClick={resetState}>Назад</button>
                </form>
            )}
            {step === 'createPass' && userForSetup && (
                <form onSubmit={handleCreatePassword} className="login-form">
                    <p>Добро пожаловать, {userForSetup.nickname}! Задайте ваш пароль.</p>
                    <input
                        type="password"
                        className="login-input"
                        placeholder="Новый пароль"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="login-input"
                        placeholder="Подтвердите пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                     <button type="submit" className="login-button">Сохранить и войти</button>
                     <button type="button" className="link-button" onClick={resetState}>Назад</button>
                </form>
            )}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};
