import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  centered?: boolean;
}

const variants = {
  default:
    "bg-white hover:bg-grey-05 text-grey-4 shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08),0px_1px_1px_0px_rgba(0,0,0,0.08)]",
  destructive:
    "bg-danger-500 hover:bg-danger-600 text-white shadow-[0px_0px_0px_1px_rgba(222,36,36,0.50),0px_1px_2px_0px_rgba(96,0,0,0.08),0px_1px_1px_0px_rgba(86,0,0,0.08)]",
};

export function Button({ children, variant = 'default', centered = false, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`h-8 px-2 py-1 rounded-md inline-flex ${centered ? 'justify-center' : 'justify-start'} items-center gap-2 overflow-hidden transition-colors ${variants[variant]} ${className}`}
    >
      <span className={`text-sm font-medium font-['Figtree'] leading-6 ${variant === 'destructive' ? 'text-white' : 'text-grey-4'}`}>
        {children}
      </span>
    </button>
  );
}
