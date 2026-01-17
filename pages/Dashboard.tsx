
import React from 'react';
import { MOCK_GAMES, ADMIN_USER } from '../constants';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <Layout activeBanner="Welcome to the BlocVerse Spring Event! Collect eggs to win prizes!">
      <div className="flex flex-col space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200 shrink-0">
            <img src={ADMIN_USER.avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800">Hello, {ADMIN_USER.displayName}!</h1>
            <p className="text-gray-500 font-medium">Ready to explore the BlocVerse today?</p>
          </div>
        </div>

        {/* Continue Playing */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Continue Playing</h2>
            <Link to="/games" className="text-blue-500 text-sm font-bold hover:underline">See All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {MOCK_GAMES.slice(0, 5).map(game => (
              <Link key={game.id} to={`/game/${game.id}`} className="bg-white rounded-lg border p-1 hover:shadow transition group">
                <img src={game.thumbnail} className="aspect-square object-cover rounded-md mb-2" alt="" />
                <p className="text-xs font-bold truncate px-1">{game.title}</p>
                <p className="text-[10px] text-gray-400 px-1 pb-1">{game.rating}% Rating</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Friend Activity (Placeholders) */}
        <section className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Friend Activity</h2>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative">
                    <img src={`https://picsum.photos/seed/friend-${i}/100`} alt="" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold">PlayerFriend_{i}</p>
                    <p className="text-xs text-gray-500">Playing: <span className="text-blue-500 cursor-pointer hover:underline">Work at a Pizza Place</span></p>
                  </div>
                </div>
                <button className="bg-[#232527] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded hover:bg-gray-700 transition opacity-0 group-hover:opacity-100">Join</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
