
import React from 'react';
import { ParsedQuery } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface AiAnalysisProps {
  parsedQuery: ParsedQuery;
  summary: string | null;
  isLoadingSummary: boolean;
}

const AiAnalysis: React.FC<AiAnalysisProps> = ({ parsedQuery, summary, isLoadingSummary }) => {
  return (
    <div className="mt-8 max-w-2xl mx-auto bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-5 animate-fade-in-up">
      <div className="flex items-center mb-3">
        <SparklesIcon className="w-6 h-6 text-cyan-400 mr-3" />
        <h2 className="text-lg font-semibold text-gray-200">AI Analysis</h2>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-gray-400">
          I've understood your request. Here's the plan:
        </p>
        <div className="flex items-start">
          <span className="text-gray-300 font-medium w-28 shrink-0">Search for:</span>
          <span className="text-indigo-300 bg-indigo-900/50 px-2 py-1 rounded-md">
            {parsedQuery.base_query}
          </span>
        </div>
        {parsedQuery.filters.length > 0 && (
          <div className="flex items-start">
            <span className="text-gray-300 font-medium w-28 shrink-0">Apply filters:</span>
            <div className="flex flex-wrap gap-2">
              {parsedQuery.filters.map((filter, index) => (
                <span key={index} className="bg-cyan-900/60 text-cyan-300 px-2 py-1 rounded-md text-xs font-medium">
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {(summary || isLoadingSummary) && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          {isLoadingSummary ? (
             <div className="flex items-start animate-pulse">
                <div className="w-5 h-5 bg-slate-700 rounded-full mr-3 mt-1 shrink-0"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
            </div>
          ) : (
            <div className="flex items-start">
              <LightbulbIcon className="w-5 h-5 text-yellow-400 mr-3 mt-1 shrink-0" />
              <p className="text-gray-300 italic">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAnalysis;
