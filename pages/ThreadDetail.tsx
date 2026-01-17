
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { ReportType } from '../types';
import { DEFAULT_AVATAR } from '../constants';

const MediaRenderer: React.FC<{ content: string; isBanned: boolean }> = ({ content, isBanned }) => {
  if (isBanned) return <div className="font-mono break-all">{censorText(content)}</div>;

  // Split content by URLs to render them as blocks if they are media
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return (
    <div className="space-y-4 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          const lowerPart = part.toLowerCase();
          
          // Image/GIF detection (including data URLs)
          if (lowerPart.match(/\.(jpeg|jpg|gif|png|webp|svg)/) || lowerPart.startsWith('data:image/')) {
            return (
              <div key={i} className="my-4 max-w-full">
                <img src={part} alt="Post content" className="max-h-[600px] rounded-2xl border border-rojo-900/10 shadow-lg object-contain bg-black/5" />
              </div>
            );
          }
          
          // Video detection (including data URLs)
          if (lowerPart.match(/\.(mp4|webm|ogg)/) || lowerPart.startsWith('data:video/')) {
            return (
              <div key={i} className="my-4 max-w-full">
                <video controls className="max-h-[600px] w-full rounded-2xl border border-rojo-900/10 shadow-lg bg-black/5">
                  <source src={part} />
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          }

          // YouTube detection
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
          const youtubeMatch = part.match(youtubeRegex);
          if (youtubeMatch) {
            return (
              <div key={i} className="my-4 aspect-video w-full max-w-3xl">
                <iframe 
                  className="w-full h-full rounded-2xl shadow-lg border border-rojo-900/10"
                  src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            );
          }

          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-rojo-500 font-bold hover:underline break-all">{part}</a>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const ThreadDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    threads, posts, currentUser, theme, users,
    addPost, updatePost, deletePost, addReport, toggleThreadPin, toggleThreadLock, deleteThread, likePost, likeThread, incrementThreadView
  } = useAppState();
  
  const [replyText, setReplyText] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpdate = async () => {
    if (!editingPostId || !editText.trim()) return;
    await updatePost(editingPostId, editText);
    setEditingPostId(null);
    setEditText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setReplyText(prev => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n') + result + '\n');
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const isThreadLiked = thread.likedBy?.includes(currentUser?.id || '');
  const threadAuthor = users.find(u => u.id === thread.authorId);
  const isThreadAuthorBanned = threadAuthor?.status === 'Banned';

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
              <button onClick={() => toggleThreadPin(thread.id)} className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${thread.isPinned ? 'bg-rojo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{thread.isPinned ? 'Pinned' : 'Pin'}</button>
              <button onClick={() => toggleThreadLock(thread.id)} className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${thread.isLocked ? 'bg-rojo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{thread.isLocked ? 'Locked' : 'Lock'}</button>
              <button onClick={() => { if(window.confirm('Are you sure you want to delete this topic?')) { deleteThread(thread.id); navigate('/'); } }} className="px-3 py-1 bg-rojo-600/20 text-rojo-400 rounded text-[10px] font-black uppercase hover:bg-rojo-600 hover:text-white transition-all">Delete</button>
            </div>
          )}
        </div>

        <div className={`border rounded-3xl overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-48 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-rojo-950/20 border-rojo-900/20' : 'bg-rojo-50 border-rojo-100'}`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black mb-4 border overflow-hidden ${isDark ? 'bg-black border-rojo-900/50 text-rojo-500 shadow-xl shadow-rojo-500/5' : 'bg-white border-rojo-100 text-rojo-600'}`}>
                {isThreadAuthorBanned ? (
                  <img src={DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                ) : (
                  threadAuthor?.avatarUrl ? <img src={threadAuthor.avatarUrl} className="w-full h-full object-cover" alt="" /> : thread.authorName.charAt(0)
                )}
              </div>
              <p className={`font-black truncate w-full ${isThreadAuthorBanned ? 'line-through decoration-slate-500 opacity-60' : ''}`}>@{thread.authorName}</p>
              <p className="text-[9px] font-black uppercase text-slate-500 mt-1">Author</p>
            </div>
            <div className="flex-1 p-10 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-black tracking-tight">
                   {isThreadAuthorBanned ? censorText(thread.title) : thread.title}
                </h1>
                <span className="text-[10px] font-black uppercase text-slate-600">{new Date(thread.createdAt).toLocaleString()}</span>
              </div>
              <div className={`leading-relaxed mb-10 flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MediaRenderer content={thread.content} isBanned={isThreadAuthorBanned} />
              </div>
              <div className="flex items-center justify-between border-t border-rojo-900/10 pt-6">
                <div className="flex items-center gap-6">
                  <button onClick={() => likeThread(thread.id)} className={`flex items-center gap-2 font-black text-xs uppercase transition-all hover:scale-105 ${isThreadLiked ? 'text-rojo-500' : 'text-slate-500 hover:text-rojo-400'}`}>
                    <svg className={`w-5 h-5 ${isThreadLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {thread.likes} Likes
                  </button>
                  <button onClick={() => addReport(ReportType.THREAD, thread.id, 'Violation of Community Standards', thread.content.substring(0, 100), thread.authorName, window.location.href)} className="text-[10px] font-black uppercase text-slate-600 hover:text-rojo-500 transition-colors">Report Thread</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{threadPosts.length} Replies</h2>
          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser?.id || '');
            const postAuthor = users.find(u => u.id === post.authorId);
            const isPostAuthorBanned = postAuthor?.status === 'Banned';
            const isMyPost = post.authorId === currentUser?.id;
            const canManage = isMyPost || isAdmin;

            return (
              <div key={post.id} id={post.id} className={`border rounded-[2rem] overflow-hidden shadow-lg flex transition-all ${isDark ? 'bg-black/40 border-rojo-900/20' : 'bg-white border-rojo-100'}`}>
                <div className={`w-16 md:w-32 p-4 flex flex-col items-center text-center shrink-0 border-r ${isDark ? 'bg-rojo-950/10 border-rojo-900/10' : 'bg-rojo-50 border-rojo-100'}`}>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg font-black mb-2 border overflow-hidden ${isDark ? 'bg-black border-rojo-900/30 text-slate-500' : 'bg-white border-rojo-100 text-slate-600'}`}>
                    {isPostAuthorBanned ? (
                      <img src={DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                    ) : (
                      postAuthor?.avatarUrl ? <img src={postAuthor.avatarUrl} className="w-full h-full object-cover" alt="" /> : post.authorName.charAt(0)
                    )}
                  </div>
                  <p className={`text-[9px] font-black truncate w-full text-slate-400 ${isPostAuthorBanned ? 'line-through decoration-slate-600 opacity-60' : ''}`}>@{post.authorName}</p>
                </div>
                <div className="flex-1 p-6 flex flex-col">
                  {editingPostId === post.id ? (
                    <div className="space-y-4">
                      <textarea 
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className={`w-full p-4 rounded-xl border text-sm outline-none focus:ring-1 ring-rojo-500 ${isDark ? 'bg-rojo-950 border-rojo-900/50' : 'bg-slate-50 border-slate-200'}`}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleUpdate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">Save</button>
                        <button onClick={() => setEditingPostId(null)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`mb-4 flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <MediaRenderer content={post.content} isBanned={isPostAuthorBanned} />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase pt-2 border-t border-rojo-900/5">
                     <div className="flex items-center gap-4">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {canManage && !isPostAuthorBanned && !editingPostId && (
                           <div className="flex items-center gap-3">
                              <button onClick={() => { setEditingPostId(post.id); setEditText(post.content); }} className="hover:text-rojo-500">Edit</button>
                              <button onClick={() => { if(window.confirm('Delete this post?')) deletePost(post.id); }} className="hover:text-rojo-500">Delete</button>
                           </div>
                        )}
                     </div>
                     <div className="flex items-center space-x-6">
                        <button onClick={() => likePost(post.id)} className={`flex items-center gap-1 font-black transition-all hover:scale-110 ${isLiked ? 'text-rojo-500' : 'hover:text-rojo-400'}`}>
                          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button onClick={() => addReport(ReportType.POST, post.id, 'Post Violation', post.content.substring(0, 100), post.authorName, `${window.location.href}#${post.id}`)} className="hover:text-rojo-500 transition-colors">Flag</button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {currentUser && !thread.isLocked ? (
          <div className={`border rounded-3xl p-10 shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">Post a Reply</h3>
               <div className="flex items-center gap-2">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-rojo-950/20 text-rojo-500 hover:bg-rojo-500 hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </button>
               </div>
            </div>
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={`w-full h-32 rounded-2xl p-5 text-sm outline-none focus:ring-2 ring-rojo-500 mb-6 border transition-all ${isDark ? 'bg-rojo-950 border-rojo-900/50 text-white placeholder-slate-800' : 'bg-rojo-50 border-rojo-100'}`}
              placeholder="Paste media links or upload files directly..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReply}
                disabled={isSubmitting || !replyText.trim()}
                className="bg-rojo-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rojo-500 shadow-xl shadow-rojo-900/40 disabled:opacity-20 transition-all"
              >
                Post Reply
              </button>
            </div>
          </div>
        ) : thread.isLocked ? (
          <div className={`p-12 text-center border rounded-3xl border-dashed transition-all ${isDark ? 'border-rojo-900/30 text-slate-500' : 'border-rojo-100 text-slate-400'}`}>
            <p className="font-black uppercase text-xs tracking-[0.3em] text-rojo-500">Thread Locked</p>
            <p className="text-[10px] mt-2 font-medium">This topic is no longer accepting replies.</p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ThreadDetailPage;
