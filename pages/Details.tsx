
import React from 'react';
// Fix: Use absolute ESM path to resolve exported member errors
import { useParams, Link } from 'https://esm.sh/react-router-dom';
import { MOCK_GAMES, MOCK_CATALOG } from '../constants';
import Layout from '../components/Layout';

const DetailPage: React.FC<{ type: 'game' | 'item' }> = ({ type }) => {
  const { id } = useParams();
  
  const content = type === 'game' 
    ? MOCK_GAMES.find(g => g.id === id)
    : MOCK_CATALOG.find(i => i.id === id);

  if (!content) return <Layout><div className="text-center py-20 text-gray-500">Content not found.</div></Layout>;

  const isGame = type === 'game';
  const game = content as any;
  const item = content as any;

  return (
    <Layout>
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row p-6 md:p-10 gap-10">
          {/* Main Visual */}
          <div className="flex-1">
            <div className={`aspect-square md:aspect-video rounded-lg overflow-hidden bg-gray-100 border shadow-inner`}>
              <img src={content.thumbnail} className="w-full h-full object-cover" alt="" />
            </div>
            {isGame && (
              <div className="mt-4 flex space-x-4">
                <button className="flex-1 bg-green-500 text-white font-black text-xl py-4 rounded-lg shadow-lg hover:bg-green-600 transition flex items-center justify-center">
                  <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  PLAY
                </button>
              </div>
            )}
          </div>

          {/* Info Side */}
          <div className="w-full md:w-96 flex flex-col">
            <h1 className="text-3xl font-black mb-1">{isGame ? game.title : item.name}</h1>
            <div className="mb-6">
              <span className="text-sm text-gray-500">By </span>
              <Link to="/profile" className="text-sm text-blue-500 font-bold hover:underline">{isGame ? game.creatorName : item.creatorName}</Link>
            </div>

            <div className="flex items-center space-x-6 mb-8 border-y py-4">
              <div className="text-center">
                <p className="text-xl font-bold">{isGame ? `${game.rating}%` : 'Free'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{isGame ? 'Rating' : 'Price'}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{isGame ? game.visits.toLocaleString() : 'Hat'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{isGame ? 'Visits' : 'Type'}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{isGame ? game.activePlayers.toLocaleString() : 'N/A'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{isGame ? 'Active' : 'Stock'}</p>
              </div>
            </div>

            {!isGame && (
               <button className="w-full bg-blue-500 text-white font-black py-4 rounded-lg shadow-lg hover:bg-blue-600 transition flex items-center justify-center mb-6">
                 BUY FOR {item.price > 0 ? `${item.price} R$` : 'FREE'}
               </button>
            )}

            <div className="space-y-4">
              <h2 className="font-bold text-sm uppercase text-gray-400">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{content.description}</p>
            </div>

            <div className="mt-auto pt-8 flex space-x-4">
              <button className="flex-1 border-2 border-gray-200 rounded py-2 text-xs font-black uppercase text-gray-500 hover:bg-0 transition">Favorite</button>
              <button className="flex-1 border-2 border-gray-200 rounded py-2 text-xs font-black uppercase text-gray-500 hover:bg-0 transition">Follow</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DetailPage;
