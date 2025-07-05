import React from 'react';
import { PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const AnalyticsView = ({ pieChartData }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Expense Distribution</h3>
            <p className="text-gray-600">How your money is allocated across categories</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
            <PieChart className="w-6 h-6 text-white" />
          </div>
        </div>
        {pieChartData.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
              <PieChart className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-xl font-medium">No expense data available</p>
            <p className="text-gray-400 text-sm mt-2">Add some expenses to see the distribution</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {pieChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;
