
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { ReportType } from '../types';

const ThreadDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    threads, posts, currentUser, theme,
    addPost, addReport, toggleThreadPin, toggleThreadLock, deleteThread, likePost, likeThread, incrementThreadView
  } = useAppState();
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const thread = threads.find(t => t.id === id);
  const threadPosts = posts.filter(p => p.threadId === id);
  const isDark = theme === 'dark';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Moderator';

  useEffect(() => {
    if (id) incrementThreadView(id);
  }, [id]);

  if (!thread) return <Layout><div className="p-20 text-center text-slate-500">Thread not found.</div></Layout>;

  const handleReply = () => {
    if (!replyText.trim() || isSubmitting || thread.isLocked) return;
    setIsSubmitting(true);
    addPost(thread.id, replyText);
    setReplyText('');
    setIsSubmitting(false);
  };

  const isThreadLiked = thread.likedBy?.includes(currentUser?.id || '');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-rojo-500 text-sm font-black uppercase tracking-widest hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => toggleThreadPin(thread.id)} className={`px-3 py-1 rounded text-[10px] font-black uppercase ${thread.isPinned ? 'bg-rojo-600' : 'bg-slate-800 text-slate-400'}`}>{thread.isPinned ? 'Pinned' : 'Pin'}</button>
              <button onClick={() => toggleThreadLock(thread.id)} className={`px-3 py-1 rounded text-[10px] font-black uppercase ${thread.isLocked ? 'bg-rojo-600' : 'bg-slate-800 text-slate-400'}`}>{thread.isLocked ? 'Locked' : 'Lock'}</button>
              <button onClick={() => { if(window.confirm('Delete?')) deleteThread(thread.id); navigate('/'); }} className="px-3 py-1 bg-rojo-600/20 text-rojo-400 rounded text-[10px] font-black uppercase">Delete</button>
            </div>
          )}
        </div>

        <div className={`border rounded-3xl overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-48 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-rojo-950/20 border-rojo-900/20' : 'bg-rojo-50 border-rojo-100'}`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black mb-4 border ${isDark ? 'bg-black border-rojo-900/50 text-rojo-500' : 'bg-white border-rojo-100 text-rojo-600'}`}>
                {thread.authorName.charAt(0)}
              </div>
              <p className="font-black truncate w-full">@{thread.authorName}</p>
            </div>
            <div className="flex-1 p-10 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-black tracking-tight">{thread.title}</h1>
                <span className="text-[10px] font-black uppercase text-slate-600">{new Date(thread.createdAt).toLocaleString()}</span>
              </div>
              <div className={`leading-relaxed mb-10 flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{thread.content}</div>
              <div className="flex items-center justify-between border-t border-rojo-900/10 pt-6">
                <button onClick={() => likeThread(thread.id)} className={`flex items-center gap-1 font-black text-xs uppercase ${isThreadLiked ? 'text-rojo-500' : 'text-slate-500 hover:text-rojo-400'}`}>
                  <svg className={`w-5 h-5 ${isThreadLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {thread.likes} Likes
                </button>
                <button onClick={() => addReport(ReportType.THREAD, thread.id, 'Inappropriate Content', thread.content.substring(0, 100), thread.authorName, window.location.href)} className="text-[10px] font-black uppercase text-slate-600 hover:text-rojo-500">Report</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser?.id || '');
            return (
              <div key={post.id} className={`border rounded-[2rem] overflow-hidden shadow-lg flex transition-all ${isDark ? 'bg-black/40 border-rojo-900/20' : 'bg-white border-rojo-100'}`}>
                <div className={`w-16 md:w-32 p-4 flex flex-col items-center text-center shrink-0 border-r ${isDark ? 'bg-rojo-950/10 border-rojo-900/10' : 'bg-rojo-50 border-rojo-100'}`}>
                  <p className="text-[9px] font-black truncate w-full text-slate-400">@{post.authorName}</p>
                </div>
                <div className="flex-1 p-6">
                  <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{post.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase">
                     <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                     <div className="flex items-center space-x-6">
                        <button onClick={() => likePost(post.id)} className={`flex items-center gap-1 font-black ${isLiked ? 'text-rojo-500' : 'hover:text-rojo-400'}`}>
                          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button onClick={() => addReport(ReportType.POST, post.id, 'Violation', post.content.substring(0, 50), post.authorName, `${window.location.href}#${post.id}`)} className="hover:text-rojo-500">Flag</button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {currentUser && !thread.isLocked ? (
          <div className={`border rounded-3xl p-10 shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={`w-full h-32 rounded-2xl p-5 text-sm outline-none focus:ring-2 ring-rojo-500 mb-6 border ${isDark ? 'bg-rojo-950 border-rojo-900/50 text-white' : 'bg-rojo-50 border-rojo-100'}`}
              placeholder="Post a reply..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReply}
                disabled={isSubmitting || !replyText.trim()}
                className="bg-rojo-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rojo-500 disabled:opacity-20 transition-all"
              >
                Post Reply
              </button>
            </div>
          </div>
        ) : thread.isLocked ? (
          <div className="p-12 text-center opacity-40">
            <p className="font-black uppercase text-xs tracking-widest text-rojo-500">Thread Locked</p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ThreadDetailPage;
