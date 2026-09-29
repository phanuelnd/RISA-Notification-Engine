import React from 'react';
import { clsx } from 'clsx';
import { Card } from '../../components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Statistics card component for displaying key metrics
 * Shows value, change indicator, and optional icon
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon,
  loading = false,
  className
}) => {
  const changeClasses = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  const changeIcon = {
    positive: '↗',
    negative: '↘',
    neutral: '→'
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            {icon && <div className="h-6 w-6 bg-gray-200 rounded"></div>}
          </div>
          <div className="mt-2">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="mt-1 h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={clsx('hover:shadow-md transition-shadow', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      
      <div className="mt-2">
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <span
              className={clsx(
                'ml-2 flex items-baseline text-sm font-medium px-2 py-1 rounded-full',
                changeClasses[changeType]
              )}
            >
              <span className="mr-1">{changeIcon[changeType]}</span>
              {change}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};
