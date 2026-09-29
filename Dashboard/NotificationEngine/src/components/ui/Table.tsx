import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, FileText, Loader2 } from 'lucide-react';
import type { TableColumn, TableSort } from '../../types';

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sort?: TableSort;
  onSort?: (sort: TableSort) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Modern, accessible Table component with enhanced design
 * Features: sorting, loading states, hover effects, and responsive design
 */
export function Table<T extends Record<string, any>>({
  data,
  columns,
  sort,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  className
}: TableProps<T>) {
  const handleSort = (column: string) => {
    if (!onSort) return;
    
    const newDirection = sort?.column === column && sort?.direction === 'asc' ? 'desc' : 'asc';
    onSort({ column, direction: newDirection });
  };

  const getSortIcon = (column: string) => {
    if (sort?.column !== column) {
      return <div className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity duration-200" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  // Loading state with improved spinner and layout
  if (loading) {
    return (
      <div className={clsx(
        'bg-white rounded-2xl border border-gray-200/60 shadow-sm',
        'backdrop-blur-sm bg-white/95',
        className
      )}>
        <div className="px-8 py-20 text-center">
          <div className="relative mx-auto w-10 h-10 mb-6">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading data</h3>
          <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  // Empty state with better visual design
  if (data.length === 0) {
    return (
      <div className={clsx(
        'bg-white rounded-2xl border border-gray-200/60 shadow-sm',
        'backdrop-blur-sm bg-white/95',
        className
      )}>
        <div className="px-8 py-20 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No data found</h3>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-gray-200/60 overflow-hidden',
      'shadow-sm hover:shadow-lg transition-all duration-300',
      'backdrop-blur-sm bg-white/95',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b border-gray-200/70">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={clsx(
                    'px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider',
                    'group relative',
                    {
                      'cursor-pointer hover:bg-blue-50/50 active:bg-blue-100/50 transition-all duration-200': 
                        column.sortable && onSort,
                      'cursor-default': !column.sortable || !onSort
                    }
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort && handleSort(column.key as string)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 group-hover:text-gray-900">
                      {column.label}
                    </span>
                    {column.sortable && onSort && (
                      <div className="ml-2 flex-shrink-0">
                        {getSortIcon(column.key as string)}
                      </div>
                    )}
                  </div>
                  {/* Subtle bottom border for sortable columns */}
                  {column.sortable && onSort && sort?.column === column.key && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform scale-x-100 transition-transform duration-200" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100/60">
            {data.map((item, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={clsx(
                  'group transition-all duration-200 ease-in-out',
                  'hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/20 hover:to-blue-50/40',
                  'hover:shadow-sm hover:-translate-y-0.5',
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={clsx(
                      'px-6 py-4 text-sm',
                      'transition-all duration-200 ease-in-out',
                      'group-hover:text-gray-900'
                    )}
                  >
                    <div className="font-medium text-gray-800 leading-relaxed">
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '—')
                      }
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}