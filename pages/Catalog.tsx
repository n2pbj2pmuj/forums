
import React, { useState } from 'react';
import { MOCK_CATALOG } from '../constants';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const CatalogPage: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Hat', 'Shirt', 'Gear', 'Accessory'];

  const filteredItems = filter === 'All' 
    ? MOCK_CATALOG 
    : MOCK_CATALOG.filter(item => item.type === filter);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Filter Sidebar */}
        <aside className="w-full md:w-48 shrink-0">
          <h2 className="font-bold text-lg mb-4">Category</h2>
          <div className="flex flex-col space-y-1">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`text-left px-3 py-1.5 rounded text-sm transition ${filter === cat ? 'bg-blue-100 text-blue-600 font-bold' : 'hover:bg-gray-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="mt-8 border-t pt-4">
            <h2 className="font-bold text-sm mb-2">Price Range</h2>
            <div className="space-y-2">
              <input type="number" placeholder="Min" className="w-full border rounded px-2 py-1 text-xs" />
              <input type="number" placeholder="Max" className="w-full border rounded px-2 py-1 text-xs" />
              <button className="w-full bg-gray-200 py-1 rounded text-xs font-bold">Go</button>
            </div>
          </div>
        </aside>

        {/* Catalog Items Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Avatar Shop</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="border rounded px-2 py-1 text-sm outline-none">
                <option>Relevance</option>
                <option>Price (Low to High)</option>
                <option>Price (High to Low)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <Link key={item.id} to={`/catalog/${item.id}`} className="bg-white border rounded p-3 hover:shadow-lg transition group">
                <div className="relative mb-3">
                  <img src={item.thumbnail} alt={item.name} className="w-full aspect-square object-contain rounded-md" />
                  {item.isLimited && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-[9px] font-black uppercase px-1 rounded-bl">Limited</div>
                  )}
                </div>
                <h3 className="font-bold text-sm mb-1 truncate group-hover:text-blue-500 transition">{item.name}</h3>
                <p className="text-[10px] text-gray-400 mb-2">By {item.creatorName}</p>
                <div className="flex items-center text-xs font-bold text-amber-600">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                  {item.price === 0 ? 'Free' : item.price.toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CatalogPage;
