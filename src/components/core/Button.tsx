import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'icon';
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', children, className = '', ...props }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-event-pilot-blue focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-event-pilot-blue text-white hover:bg-event-pilot-blue/90 rounded-sm px-4 py-3 text-sm",
    secondary: "bg-white text-text-secondary border border-gray-200 hover:bg-surface-hover rounded-sm px-4 py-3 text-sm",
    tertiary: "text-text-secondary hover:text-foreground bg-transparent underline-offset-4 hover:underline",
    icon: "h-10 w-10 rounded-full hover:bg-surface-hover text-foreground flex items-center justify-center"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
