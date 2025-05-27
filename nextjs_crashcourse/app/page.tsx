'use client';

import { useEffect, useState } from 'react';
import RecordList from "./components/RecordList";

interface Album {
  id: number;
  title: string;
  userId: number;
}

export default function Home() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/albums');
        if (!response.ok) {
          throw new Error('Failed to fetch albums');
        }
        const data = await response.json();
        setAlbums(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          Music Records Collection
        </h1>
        <div className="text-center mb-8">
          <a 
            href="https://www.discogs.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Browse Music Store
          </a>
        </div>
        
        {loading && (
          <div className="text-center text-gray-600">Loading albums...</div>
        )}
        
        {error && (
          <div className="text-center text-red-600">Error: {error}</div>
        )}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <div 
                key={album.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold mb-2">{album.title}</h2>
                <p className="text-gray-600">Album ID: {album.id}</p>
                <p className="text-gray-600">User ID: {album.userId}</p>
              </div>
            ))}
          </div>
        )}
        
        <RecordList />
      </div>
    </main>
  );
}
