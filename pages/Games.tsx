
import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_GAMES } from '../constants';
import Layout from '../components/Layout';

const GamesPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6">Discover Games</h1>
        
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            <button className="text-blue-500 text-sm font-medium hover:underline">See All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MOCK_GAMES.map(game => (
              <Link key={game.id} to={`/game/${game.id}`} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition group">
                <div className="aspect-video relative overflow-hidden">
                  <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                    {game.activePlayers.toLocaleString()}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate mb-1">{game.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{game.rating}% Rating</span>
                    <span>By {game.creatorName}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold">Most Engaging</h2>
            <button className="text-blue-500 text-sm font-medium hover:underline">See All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...MOCK_GAMES, ...MOCK_GAMES].slice(0, 6).map((game, idx) => (
              <Link key={`${game.id}-${idx}`} to={`/game/${game.id}`} className="bg-white rounded-md border p-1 hover:shadow transition group">
                <img src={`https://picsum.photos/seed/${game.id}-${idx}/200`} className="aspect-square object-cover rounded mb-2" alt={game.title} />
                <p className="text-xs font-bold truncate px-1">{game.title}</p>
                <p className="text-[10px] text-gray-400 px-1 pb-1">{game.visits.toLocaleString()} Visits</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default GamesPage;
