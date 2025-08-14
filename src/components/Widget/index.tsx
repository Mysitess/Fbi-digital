import React from 'react';
import './index.css';

interface WidgetProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}
export const Widget = ({ title, children, className = '' }: WidgetProps) => (
  <div className={`widget ${className}`}>
    <h3 className="widget-title">{title}</h3>
    {children}
  </div>
);
