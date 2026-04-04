// components/Table.js
import { useTheme } from '../context/ThemeContext';

export default function Table({ columns, data, onRowClick, loading = false }) {
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-12 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
      }`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } shadow`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
              } transition-colors`}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}