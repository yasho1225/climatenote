import React from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** When true, button spans full container width */
  fullWidth?: boolean;
}

export default function GradientButton({
  children,
  fullWidth = true,
  className = '',
  type = 'button',
  ...props
}: GradientButtonProps) {
  return (
    <button
      type={type}
      className={`btn-primary ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
