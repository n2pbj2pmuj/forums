
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { ReportType } from '../types';
import { DEFAULT_AVATAR } from '../constants';

const MediaRenderer: React.FC<{ content: string; isBanned: boolean }> = ({ content, isBanned }) => {
  if (isBanned) return <div className="font-mono break-all leading-relaxed">{censorText(content)}</div>;

  // Split content by URLs or Data URIs to render them as blocks
  const mediaRegex = /(https?:\/\/[^\s]+|data:[^;]+;base64,[^\s]+)/g;
  const parts = content.split(mediaRegex);

  return (
    <div className="space-y-4 leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.match(mediaRegex)) {
          const lowerPart = part.toLowerCase();
          
          // Image/GIF detection (including data URLs)
          if (lowerPart.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)/) || lowerPart.startsWith('data:image/')) {
            return (
              <div key={i} className="my-6 max-w-full">
                <img src={part} alt="Post content" className="max-h-[700px] rounded-3xl border border-rojo-900/20 shadow-2xl object-contain bg-black/40" loading="lazy" />
              </div>
            );
          }
          
          // Video detection (including data URLs)
          if (lowerPart.match(/\.(mp4|webm|ogg|mov)/) || lowerPart.startsWith('data:video/')) {
            return (
              <div key={i} className="my-6 max-w-full">
                <video controls className="max-h-[700px] w-full rounded-3xl border border-rojo-900/20 shadow-2xl bg-black/40">
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
              <div key={i} className="my-6 aspect-video w-full max-w-4xl">
                <iframe 
                  className="w-full h-full rounded-3xl shadow-2xl border border-rojo-900/20"
                  src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            );
          }

          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-rojo-500 font-black hover:underline break-all">{part}</a>;
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
  const [pendingMedia, setPendingMedia] = useState<string[]>([]);
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

  const handleReply = async () => {
    if ((!replyText.trim() && pendingMedia.length === 0) || isSubmitting || thread.isLocked) return;
    setIsSubmitting(true);
    
    // Combine text and media into the content field
    const finalContent = [replyText.trim(), ...pendingMedia].filter(Boolean).join('\n\n');
    
    await addPost(thread.id, finalContent);
    setReplyText('');
    setPendingMedia([]);
    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!editingPostId || !editText.trim()) return;
    await updatePost(editingPostId, editText);
    setEditingPostId(null);
    setEditText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPendingMedia(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const removePendingMedia = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
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

        {/* Thread Header Block */}
        <div className={`border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-56 p-10 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-rojo-950/20 border-rojo-900/20' : 'bg-rojo-50 border-rojo-100'}`}>
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black mb-6 border-4 overflow-hidden shadow-xl ${isDark ? 'bg-black border-rojo-900/50 text-rojo-500' : 'bg-white border-rojo-100 text-rojo-600'}`}>
                {isThreadAuthorBanned ? (
                  <img src={DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                ) : (
                  threadAuthor?.avatarUrl ? <img src={threadAuthor.avatarUrl} className="w-full h-full object-cover" alt="" /> : thread.authorName.charAt(0)
                )}
              </div>
              <p className={`font-black text-sm truncate w-full ${isThreadAuthorBanned ? 'line-through decoration-slate-500 opacity-60' : ''}`}>@{thread.authorName}</p>
              <p className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-widest">Original Poster</p>
            </div>
            <div className="flex-1 p-10 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-8">
                <h1 className={`text-4xl font-black tracking-tighter ${isThreadAuthorBanned ? 'line-through decoration-rojo-500 opacity-50' : ''}`}>
                   {isThreadAuthorBanned ? censorText(thread.title) : thread.title}
                </h1>
                <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full">{new Date(thread.createdAt).toLocaleString()}</span>
              </div>
              <div className={`mb-10 flex-1 text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MediaRenderer content={thread.content} isBanned={isThreadAuthorBanned} />
              </div>
              <div className="flex items-center justify-between border-t border-rojo-900/10 pt-8">
                <div className="flex items-center gap-8">
                  <button onClick={() => likeThread(thread.id)} className={`flex items-center gap-2 font-black text-sm uppercase transition-all hover:scale-110 ${isThreadLiked ? 'text-rojo-500' : 'text-slate-500 hover:text-rojo-400'}`}>
                    <svg className={`w-6 h-6 ${isThreadLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {thread.likes}
                  </button>
                  <button onClick={() => addReport(ReportType.THREAD, thread.id, 'Violation', thread.content.substring(0, 100), thread.authorName, window.location.href)} className="text-[11px] font-black uppercase text-slate-500 hover:text-rojo-500 transition-colors tracking-widest">Report Thread</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replies List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-4">
             <div className="h-0.5 flex-1 bg-rojo-900/10"></div>
             <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{threadPosts.length} Replies</h2>
             <div className="h-0.5 flex-1 bg-rojo-900/10"></div>
          </div>
          
          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser?.id || '');
            const postAuthor = users.find(u => u.id === post.authorId);
            const isPostAuthorBanned = postAuthor?.status === 'Banned';
            const isMyPost = post.authorId === currentUser?.id;
            const canManage = isMyPost || isAdmin;

            return (
              <div key={post.id} id={post.id} className={`border rounded-[2.5rem] overflow-hidden shadow-lg flex transition-all ${isDark ? 'bg-black border-rojo-900/20' : 'bg-white border-rojo-100'}`}>
                <div className={`w-20 md:w-36 p-6 flex flex-col items-center text-center shrink-0 border-r ${isDark ? 'bg-rojo-950/10 border-rojo-900/10' : 'bg-rojo-50 border-rojo-100'}`}>
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black mb-4 border-2 overflow-hidden shadow-lg ${isDark ? 'bg-black border-rojo-900/30 text-slate-500' : 'bg-white border-rojo-100 text-slate-600'}`}>
                    {isPostAuthorBanned ? (
                      <img src={DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                    ) : (
                      postAuthor?.avatarUrl ? <img src={postAuthor.avatarUrl} className="w-full h-full object-cover" alt="" /> : post.authorName.charAt(0)
                    )}
                  </div>
                  <p className={`text-[10px] font-black truncate w-full text-slate-500 ${isPostAuthorBanned ? 'line-through decoration-slate-600 opacity-60' : ''}`}>@{post.authorName}</p>
                </div>
                <div className="flex-1 p-8 flex flex-col min-w-0">
                  {editingPostId === post.id ? (
                    <div className="space-y-4">
                      <textarea 
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className={`w-full p-6 rounded-3xl border text-sm outline-none focus:ring-2 ring-rojo-500 ${isDark ? 'bg-rojo-950 border-rojo-900/50 text-white' : 'bg-slate-50 border-slate-200'}`}
                        rows={5}
                      />
                      <div className="flex gap-3">
                        <button onClick={handleUpdate} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Save Changes</button>
                        <button onClick={() => setEditingPostId(null)} className="px-6 py-2 bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`mb-6 flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <MediaRenderer content={post.content} isBanned={isPostAuthorBanned} />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-black uppercase pt-4 border-t border-rojo-900/5">
                     <div className="flex items-center gap-6">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {canManage && !isPostAuthorBanned && !editingPostId && (
                           <div className="flex items-center gap-4">
                              <button onClick={() => { setEditingPostId(post.id); setEditText(post.content); }} className="hover:text-rojo-500 transition-colors">Edit</button>
                              <button onClick={() => { if(window.confirm('Are you sure you want to delete this post?')) deletePost(post.id); }} className="text-rojo-500 hover:text-rojo-400 transition-colors">Delete</button>
                           </div>
                        )}
                     </div>
                     <div className="flex items-center space-x-6">
                        <button onClick={() => likePost(post.id)} className={`flex items-center gap-1.5 font-black transition-all hover:scale-125 ${isLiked ? 'text-rojo-500' : 'hover:text-rojo-400'}`}>
                          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button onClick={() => addReport(ReportType.POST, post.id, 'Violation', post.content.substring(0, 100), post.authorName, `${window.location.href}#${post.id}`)} className="hover:text-rojo-500 transition-colors tracking-widest">Flag</button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Editor */}
        {currentUser && !thread.isLocked ? (
          <div className={`border rounded-[2.5rem] p-10 shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Post a Reply</h3>
               <div className="flex items-center gap-3">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" multiple />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rojo-950/20 text-rojo-500 hover:bg-rojo-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload Media
                  </button>
               </div>
            </div>

            {/* Pending Media Shelf */}
            {pendingMedia.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-8 p-6 bg-slate-900/20 rounded-3xl border border-dashed border-rojo-900/30 animate-in fade-in zoom-in duration-300">
                {pendingMedia.map((data, idx) => (
                  <div key={idx} className="relative group w-32 h-32 rounded-2xl overflow-hidden border-2 border-rojo-900/20 shadow-xl">
                    {data.startsWith('data:image/') ? (
                      <img src={data} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <svg className="w-10 h-10 text-rojo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                      </div>
                    )}
                    <button 
                      onClick={() => removePendingMedia(idx)}
                      className="absolute top-2 right-2 p-1 bg-rojo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={`w-full h-40 rounded-[2rem] p-8 text-sm outline-none focus:ring-4 ring-rojo-500/20 mb-8 border transition-all ${isDark ? 'bg-rojo-950/20 border-rojo-900/40 text-white placeholder-slate-800' : 'bg-rojo-50/50 border-rojo-100'}`}
              placeholder="Join the discussion... You can also paste links to YouTube videos or direct images."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReply}
                disabled={isSubmitting || (!replyText.trim() && pendingMedia.length === 0)}
                className="bg-rojo-600 text-white px-16 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-rojo-500 shadow-2xl shadow-rojo-500/30 disabled:opacity-10 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        ) : thread.isLocked ? (
          <div className={`p-16 text-center border rounded-[3rem] border-dashed transition-all ${isDark ? 'border-rojo-900/30 text-slate-500 bg-rojo-950/5' : 'border-rojo-100 text-slate-400 bg-slate-50/50'}`}>
            <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8 text-rojo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="font-black uppercase text-[11px] tracking-[0.5em] text-rojo-500">Thread Locked</p>
            <p className="text-[10px] mt-4 font-bold opacity-60">This discussion has been archived and is no longer accepting new replies.</p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ThreadDetailPage;
