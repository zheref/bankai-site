import * as React from 'react';

export function Card({ children, className = '', as: Tag = 'div', ...rest }: { children: React.ReactNode; className?: string; as?: 'div' | 'li' | 'article' } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={`surface p-5 sm:p-6 ${className}`} {...rest}>{children}</Tag>;
}
