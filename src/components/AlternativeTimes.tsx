import React from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import type { AlternativeTime } from '../lib/conflicts';

interface AlternativeTimesProps {
  alternatives: AlternativeTime[];
  isLoading: boolean;
  onSelectTime: (startTime: string, endTime: string) => void;
}

export default function AlternativeTimes({
  alternatives,
  isLoading,
  onSelectTime
}: AlternativeTimesProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
        <p className="text-blue-600 dark:text-blue-400">Finding alternative times...</p>
      </div>
    );
  }

  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
        <p className="text-amber-600 dark:text-amber-400 text-sm">
          No alternative times could be found. Try adjusting the date or participants.
        </p>
      </div>
    );
  }

  // Sort alternatives by score (highest first)
  const sortedAlternatives = [...alternatives].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center">
        <Clock className="w-4 h-4 mr-2" />
        Suggested Alternative Times
      </h3>
      
      <div className="space-y-2">
        {sortedAlternatives.map((alt, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-dark-lighter rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-blue-100 dark:border-blue-900/30"
            onClick={() => onSelectTime(alt.startTime, alt.endTime)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center">
                    {format(parseISO(alt.startTime), 'h:mm a')}
                    <ArrowRight className="w-3 h-3 mx-1" />
                    {format(parseISO(alt.endTime), 'h:mm a')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(parseISO(alt.startTime), 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-12 h-12 relative mr-2">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="3"
                      className="dark:stroke-gray-700"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeDasharray={`${alt.score * 100}, 100`}
                      className="dark:stroke-blue-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                    {Math.round(alt.score * 100)}%
                  </div>
                </div>
                
                <button
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTime(alt.startTime, alt.endTime);
                  }}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 pl-11">
              {alt.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}