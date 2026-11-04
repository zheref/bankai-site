import * as React from 'react';
import { Link } from 'gatsby';

type Variant = 'primary' | 'secondary' | 'ghost';
const base = 'inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 rounded-lg font-semibold text-base no-underline transition-colors duration-200 motion-reduce:transition-none';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border border-line text-text hover:border-accent hover:text-accent',
  ghost: 'text-accent hover:underline px-2',
};

type Props = { variant?: Variant; href?: string; to?: string; className?: string; children: React.ReactNode } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & Record<`data-${string}`, string | undefined>;

/** One button shape for links and actions; 44px minimum height (UX-3), visible focus from the base styles (UX-1). */
export function Button({ variant = 'primary', href, to, className = '', children, ...rest }: Props) {
  const cls = `${base} ${variants[variant]} ${className}`;
  const data = Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith('data-') || k.startsWith('aria-')));
  if (to) return <Link to={to} className={cls} {...data}>{children}</Link>;
  if (href) return <a href={href} className={cls} rel={href.startsWith('http') ? 'noopener' : undefined} {...data}>{children}</a>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
