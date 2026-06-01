'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchForm({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search destinations, parks, hotels..."
        className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-3 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
      />
      <button
        type="submit"
        className="rounded-lg bg-stone-900 px-6 py-3 text-white font-medium hover:bg-stone-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
