import React from 'react';
import { clsx } from 'clsx';
import type { CardProps } from '../../types';

/**
 * Reusable Card component with optional title, subtitle, and actions
 * Supports hover effects and different styling variants
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  hover = false,
  children,
  className
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        'transition-all duration-300 ease-in-out',
        'bg-gradient-to-br from-white to-gray-50/50',
        {
          'hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 hover:border-gray-300': hover,
          'hover:shadow-md hover:border-gray-300': !hover
        },
        className
      )}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
};
