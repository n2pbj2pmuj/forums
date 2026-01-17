
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { analyzeForumContent } from '../services/geminiService';
import { ReportType } from '../types';

const ThreadDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    threads, posts, currentUser, theme,
    addPost, addReport, toggleThreadPin, toggleThreadLock, deleteThread, likePost 
  } = useAppState();
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const thread = threads.find(t => t.id === id);
  const threadPosts = posts.filter(p => p.threadId === id);
  const isDark = theme === 'dark';
  const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Moderator';

  if (!thread) return <Layout><div className="p-20 text-center text-slate-500">Thread not found.</div></Layout>;

  const handleReply = async () => {
    if (!replyText.trim() || isSubmitting || thread.isLocked) return;
    setIsSubmitting(true);
    await analyzeForumContent(replyText, 'Post'); // Background check
    addPost(thread.id, replyText);
    setReplyText('');
    setIsSubmitting(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this thread?')) {
      deleteThread(thread.id);
      navigate('/');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-indigo-400 text-sm font-bold hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Feed
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleThreadPin(thread.id)}
                className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${thread.isPinned ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {thread.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button 
                onClick={() => toggleThreadLock(thread.id)}
                className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${thread.isLocked ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {thread.isLocked ? 'Unlock' : 'Lock'}
              </button>
              <button 
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded text-[10px] font-black uppercase transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Original Post */}
        <div className={`border rounded-xl overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-48 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black mb-3 border ${isDark ? 'bg-slate-900 border-slate-800 text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.2)]' : 'bg-indigo-100 border-indigo-200 text-indigo-600'}`}>
                {thread.authorName.charAt(0)}
              </div>
              <p className="font-bold truncate w-full">{thread.authorName}</p>
              <p className="text-[10px] font-black uppercase text-indigo-500 mt-1">Creator</p>
            </div>
            <div className="flex-1 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-black tracking-tight">{thread.title}</h1>
                <span className="text-xs text-slate-500">{new Date(thread.createdAt).toLocaleString()}</span>
              </div>
              <div className={`leading-relaxed mb-8 flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {thread.content}
              </div>
              <div className="flex items-center space-x-6 border-t pt-4">
                <button 
                  onClick={() => addReport(ReportType.THREAD, thread.id, 'Rules Violation', thread.content.substring(0, 50))}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">{threadPosts.length} Replies</h2>
          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser.id);
            return (
              <div key={post.id} className={`border rounded-xl overflow-hidden shadow-lg flex transition-all ${isDark ? 'bg-slate-900/30 border-slate-800/50' : 'bg-white border-slate-200'}`}>
                <div className={`w-16 md:w-32 p-4 flex flex-col items-center text-center shrink-0 border-r ${isDark ? 'bg-slate-950/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg font-black mb-2 border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                    {post.authorName.charAt(0)}
                  </div>
                  <p className="text-[10px] md:text-xs font-bold truncate w-full">{post.authorName}</p>
                </div>
                <div className="flex-1 p-6">
                  <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{post.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                     <span>{new Date(post.createdAt).toLocaleString()}</span>
                     <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => likePost(post.id)}
                          className={`flex items-center gap-1 font-bold transition-colors ${isLiked ? 'text-pink-500' : 'hover:text-pink-400'}`}
                        >
                          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button 
                          onClick={() => addReport(ReportType.POST, post.id, 'User reported post', post.content.substring(0, 50))}
                          className="hover:text-red-500 font-bold uppercase transition-colors"
                        >
                          Flag
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Box */}
        {!thread.isLocked ? (
          <div className={`border rounded-xl p-6 shadow-2xl transition-all ${isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white border-slate-200'}`}>
            <h3 className="font-black mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              Post a Reply
            </h3>
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={`w-full h-32 rounded-xl p-4 text-sm outline-none focus:ring-2 ring-indigo-500 mb-4 transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200'}`}
              placeholder="Join the conversation with respect..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReply}
                disabled={isSubmitting || !replyText.trim()}
                className={`px-8 py-2 rounded-xl font-bold transition-all disabled:opacity-50 ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}
              >
                {isSubmitting ? 'Processing...' : 'Submit Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className={`border rounded-xl p-8 text-center transition-all ${isDark ? 'bg-slate-900/20 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <svg className="w-10 h-10 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="font-bold">This discussion has been locked by a moderator.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ThreadDetailPage;
