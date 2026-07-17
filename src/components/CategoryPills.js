'use client';

import { CATEGORIES } from '@/lib/mockData';

export default function CategoryPills({ selected, onChange }) {
  const all = ['All', ...CATEGORIES];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {all.map((cat) => {
        const active = selected === cat || (cat === 'All' && !selected);
        return (
          <button
            key={cat}
            onClick={() => onChange(cat === 'All' ? null : cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              active
                ? 'text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
            style={active ? { backgroundColor: '#2D4B8E' } : {}}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
