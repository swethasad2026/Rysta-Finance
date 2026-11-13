import React from 'react';
import { User } from '@/types';

interface UserAvatarProps {
  user?: Partial<User> | null;
  businessName?: string;
  email?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

/**
 * Extracts the first two uppercase initials of their business_name
 * (or the first two letters of their email if business_name is empty)
 */
export function getAvatarInitials(
  businessName?: string | null,
  email?: string | null,
  name?: string | null
): string {
  const primarySource = (businessName && businessName.trim()) || (name && name.trim()) || '';

  if (primarySource) {
    const clean = primarySource.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (clean.length >= 2) {
      return clean.slice(0, 2).toUpperCase();
    }
    if (clean.length === 1) {
      return clean.toUpperCase();
    }
  }

  if (email && email.includes('@')) {
    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    if (emailPrefix.length >= 2) {
      return emailPrefix.slice(0, 2).toUpperCase();
    }
    if (emailPrefix.length === 1) {
      return (emailPrefix + 'U').toUpperCase();
    }
  }

  return 'RF'; // Rysta Finance default
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  businessName,
  email,
  name,
  size = 'md',
  className = '',
}) => {
  const resolvedBusinessName = businessName || user?.business_name;
  const resolvedEmail = email || user?.email;
  const resolvedName = name || user?.name;

  const initials = getAvatarInitials(resolvedBusinessName, resolvedEmail, resolvedName);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-2xl tracking-wider',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-bold select-none bg-primary text-primary-foreground shadow-sm shadow-primary/20 border-2 border-background ring-1 ring-border/50 ${sizeClasses} ${className}`}
      title={resolvedBusinessName || resolvedName || resolvedEmail || 'User Avatar'}
    >
      <span className="font-semibold uppercase leading-none">{initials}</span>
    </div>
  );
};
