'use client';

import { useEffect, useState } from 'react';

interface Record {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  year: number;
}

export default function RecordList() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // TODO: Replace with actual API endpoint
        const response = await fetch('YOUR_API_ENDPOINT');
        if (!response.ok) {
          throw new Error('Failed to fetch records');
        }
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {records.map((record) => (
        <div key={record.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-64">
            <img
              src={record.coverImage}
              alt={`${record.title} cover`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{record.title}</h3>
            <p className="text-gray-600 mb-1">{record.artist}</p>
            <p className="text-gray-500">{record.year}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 