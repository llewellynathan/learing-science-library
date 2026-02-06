import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

type Category =
  | 'Memory & Retention'
  | 'Practice & Skill Building'
  | 'Motivation & Engagement'
  | 'Cognitive Load'
  | 'Feedback & Assessment'
  | 'Transfer & Application';

interface Principle {
  id: string;
  title: string;
  category: Category;
  summary: string;
  tags: string[];
}

interface SearchProps {
  principles: Principle[];
}

const categoryColors: Record<Category, string> = {
  'Memory & Retention': 'bg-purple-100 text-purple-800',
  'Practice & Skill Building': 'bg-green-100 text-green-800',
  'Motivation & Engagement': 'bg-orange-100 text-orange-800',
  'Cognitive Load': 'bg-blue-100 text-blue-800',
  'Feedback & Assessment': 'bg-yellow-100 text-yellow-800',
  'Transfer & Application': 'bg-pink-100 text-pink-800',
};

export default function Search({ principles }: SearchProps) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(
    () =>
      new Fuse(principles, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'summary', weight: 1.5 },
          { name: 'tags', weight: 1 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [principles]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 8);
  }, [query, fuse]);

  return (
    <div className="relative mb-6">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search principles..."
          className="w-full px-4 py-3 pl-10 text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {query.trim() && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-slate-500">No results found</div>
          ) : (
            <ul>
              {results.map(({ item }) => (
                <li key={item.id}>
                  <a
                    href={`/principles/${item.id}`}
                    className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[item.category]}`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {item.summary}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
