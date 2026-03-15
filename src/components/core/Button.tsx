import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'icon';
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', children, className = '', ...props }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  
  const variants = {
    primary: "bg-foreground text-background hover:opacity-90 rounded-2xl px-6 py-3.5 text-xs shadow-lg",
    secondary: "bg-surface-card text-foreground border border-surface-hover hover:bg-white rounded-2xl px-6 py-3.5 text-xs",
    tertiary: "text-foreground/70 hover:text-foreground bg-transparent underline-offset-4 hover:underline text-xs",
    icon: "h-11 w-11 rounded-full hover:bg-surface-hover text-foreground flex items-center justify-center border border-surface-hover transition-colors"
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
