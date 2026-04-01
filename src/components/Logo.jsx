import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Global Hope Logo Component
 * @param {string} size - 'sm', 'md', 'lg', 'xl'
 * @param {boolean} link - Whether to wrap in a Link to home
 * @param {string} className - Additional classes
 */
export const Logo = ({ size = 'md', link = true, className = '' }) => {
  const sizeMap = {
    sm: { text: 'text-lg', badge: 'text-base', px: 'px-1', py: 'py-0' },
    md: { text: 'text-xl', badge: 'text-base', px: 'px-1', py: 'py-0.5' },
    lg: { text: 'text-2xl', badge: 'text-xl', px: 'px-1.5', py: 'py-0.5' },
    xl: { text: 'text-4xl', badge: 'text-3xl', px: 'px-2', py: 'py-1' },
  };

  const { text, badge, px, py } = sizeMap[size] || sizeMap.md;

  const content = (
    <span className={`text-primary font-bold ${text} flex items-center gap-1 ${className}`}>
      Ho<span className={`bg-primary text-white rounded ${px} ${py} ${badge}`}>pe</span>
    </span>
  );

  if (link) {
    return <Link to="/" className="inline-block hover:opacity-90 transition-opacity">{content}</Link>;
  }

  return content;
};

export default Logo;
