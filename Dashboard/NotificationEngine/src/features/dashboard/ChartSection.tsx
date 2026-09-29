import React from 'react';
import { Card } from '../../components/ui/Card';
import { BarChart3, TrendingUp } from 'lucide-react';

interface ChartSectionProps {
  data?: {
    dailyStats: Array<{ date: string; sent: number; delivered: number; failed: number }>;
    typeStats: Array<{ type: string; count: number }>;
    statusStats: Array<{ status: string; count: number }>;
  };
  loading?: boolean;
}

/**
 * Chart section component displaying notification statistics
 * Shows daily stats, type distribution, and status breakdown
 */
export const ChartSection: React.FC<ChartSectionProps> = ({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card title="Performance Overview">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card title="Performance Overview">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No chart data available</p>
        </div>
      </Card>
    );
  }

  const maxDailyValue = Math.max(
    ...data.dailyStats.map(d => Math.max(d.sent, d.delivered, d.failed))
  );

  return (
    <Card title="Performance Overview">
      <div className="space-y-6">
        {/* Daily stats chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Daily Notifications (Last 7 Days)
            </h3>
          </div>
          <div className="space-y-3">
            {data.dailyStats.map((day, index) => {
              const total = day.sent + day.delivered + day.failed;
              const sentPercent = (day.sent / maxDailyValue) * 100;
              const deliveredPercent = (day.delivered / maxDailyValue) * 100;
              const failedPercent = (day.failed / maxDailyValue) * 100;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span>{total} total</span>
                  </div>
                  <div className="flex h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${sentPercent}%` }}
                      title={`Sent: ${day.sent}`}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${deliveredPercent}%` }}
                      title={`Delivered: ${day.delivered}`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${failedPercent}%` }}
                      title={`Failed: ${day.failed}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type and status distribution */}
        <div className="grid grid-cols-2 gap-4">
          {/* Type distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">By Type</h4>
            <div className="space-y-2">
              {data.typeStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ 
                          width: `${(item.count / Math.max(...data.typeStats.map(t => t.count))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">By Status</h4>
            <div className="space-y-2">
              {data.statusStats.map((item, index) => {
                const colors = {
                  'Sent': 'bg-blue-500',
                  'Delivered': 'bg-green-500',
                  'Failed': 'bg-red-500',
                  'Pending': 'bg-yellow-500'
                };
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors[item.status as keyof typeof colors] || 'bg-gray-500'}`}
                          style={{ 
                            width: `${(item.count / Math.max(...data.statusStats.map(s => s.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
