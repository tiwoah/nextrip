import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card = ({ children, interactive = false, className = '', ...props }: CardProps) => {
  return (
    <div 
      className={`bg-surface-card rounded-md p-[20px] transition-all duration-200 
        ${interactive ? 'hover:shadow-sm hover:bg-surface-hover cursor-pointer hover:scale-[1.02]' : ''} 
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
