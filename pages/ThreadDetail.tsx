
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { ReportType } from '../types';
import { DEFAULT_AVATAR } from '../constants';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit

const MediaRenderer: React.FC<{ content: string; isBanned: boolean }> = ({ content, isBanned }) => {
  if (isBanned) return <div className="font-mono break-all leading-relaxed opacity-60">{censorText(content)}</div>;
  const mediaRegex = /(https?:\/\/[^\s]+|data:[^;]+;base64,[^\s]+)/g;
  const parts = content.split(mediaRegex);
  return (
    <div className="space-y-4 leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.match(mediaRegex)) {
          const lowerPart = part.toLowerCase();
          if (lowerPart.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)/) || lowerPart.startsWith('data:image/')) {
            return <div key={i} className="my-6 max-w-full"><img src={part} alt="Post content" className="max-h-[700px] rounded-3xl border border-rojo-900/20 shadow-2xl object-contain bg-black/40" loading="lazy" /></div>;
          }
          if (lowerPart.match(/\.(mp4|webm|ogg|mov)/) || lowerPart.startsWith('data:video/')) {
            return <div key={i} className="my-6 max-w-full"><video controls className="max-h-[700px] w-full rounded-3xl border border-rojo-900/20 shadow-2xl bg-black/40"><source src={part} /></video></div>;
          }
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
          const youtubeMatch = part.match(youtubeRegex);
          if (youtubeMatch) {
            return <div key={i} className="my-6 aspect-video w-full max-w-4xl"><iframe className="w-full h-full rounded-3xl shadow-2xl border border-rojo-900/20" src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} frameBorder="0" allowFullScreen></iframe></div>;
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
  const { threads, posts, currentUser, theme, users, addPost, updatePost, deletePost, addReport, toggleThreadPin, toggleThreadLock, deleteThread, likePost, likeThread, incrementThreadView } = useAppState();
  
  const [replyText, setReplyText] = useState('');
  const [pendingMedia, setPendingMedia] = useState<string[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState<{type: ReportType, targetId: string, author: string} | null>(null);
  const [reportContext, setReportContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thread = threads.find(t => t.id === id);
  const threadPosts = posts.filter(p => p.threadId === id);
  const isDark = theme === 'dark';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Moderator';

  useEffect(() => { if (id) incrementThreadView(id); }, [id]);

  if (!thread) return <Layout><div className="p-20 text-center text-slate-500">Thread not found.</div></Layout>;

  const handleReply = async () => {
    if ((!replyText.trim() && pendingMedia.length === 0) || isSubmitting || thread.isLocked) return;
    setIsSubmitting(true);
    const finalContent = [replyText.trim(), ...pendingMedia].filter(Boolean).join('\n\n');
    try {
      await addPost(thread.id, finalContent);
      setReplyText('');
      setPendingMedia([]);
    } finally { setIsSubmitting(false); }
  };

  const handleReport = async () => {
    if (!showReportModal || !reportContext.trim()) return;
    await addReport(showReportModal.type, showReportModal.targetId, reportContext, 'Manual Flag', showReportModal.author, window.location.href);
    setShowReportModal(null);
    setReportContext('');
  };

  const isThreadLiked = thread.likedBy?.includes(currentUser?.id || '');
  const threadAuthor = users.find(u => u.id === thread.authorId);
  const isThreadAuthorBanned = threadAuthor?.status === 'Banned';

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-rojo-600 text-[10px] font-black uppercase tracking-[0.2em] hover:underline flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Return to Feed
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => toggleThreadPin(thread.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${thread.isPinned ? 'bg-rojo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{thread.isPinned ? 'Pinned' : 'Pin'}</button>
              <button onClick={() => toggleThreadLock(thread.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${thread.isLocked ? 'bg-rojo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{thread.isLocked ? 'Locked' : 'Lock'}</button>
              <button onClick={() => { if(window.confirm('Delete this topic permanently?')) { deleteThread(thread.id); navigate('/'); } }} className="px-4 py-1.5 bg-rojo-950/20 text-rojo-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-rojo-600 hover:text-white transition-all">Delete</button>
            </div>
          )}
        </div>

        {/* Thread Header */}
        <div className={`border rounded-[3rem] overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-black/20 border-rojo-900/30' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-64 p-12 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-rojo-950/5 border-rojo-900/10' : 'bg-slate-50/50 border-slate-100'}`}>
              <Link to={`/profile/${thread.authorId}`} className="group relative">
                <img src={isThreadAuthorBanned ? DEFAULT_AVATAR : threadAuthor?.avatarUrl} className="w-28 h-28 rounded-[2rem] border-4 border-rojo-900/20 shadow-xl group-hover:scale-105 transition-transform" alt="" />
                {!isThreadAuthorBanned && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-black"></div>}
              </Link>
              <Link to={`/profile/${thread.authorId}`} className={`font-black text-sm mt-6 block truncate w-full hover:text-rojo-500 transition-colors ${isThreadAuthorBanned ? 'line-through opacity-50' : ''}`}>@{thread.authorName}</Link>
              <p className="text-[10px] font-black uppercase text-slate-600 mt-2 tracking-[0.2em]">OP</p>
            </div>
            <div className="flex-1 p-12 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-10">
                <h1 className={`text-4xl font-black tracking-tighter leading-tight ${isThreadAuthorBanned ? 'line-through opacity-40' : ''}`}>{isThreadAuthorBanned ? censorText(thread.title) : thread.title}</h1>
                <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-900/40 px-4 py-1.5 rounded-full">{new Date(thread.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={`mb-12 flex-1 text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MediaRenderer content={thread.content} isBanned={isThreadAuthorBanned} />
              </div>
              <div className="flex items-center justify-between pt-10 border-t border-rojo-900/5">
                <button onClick={() => likeThread(thread.id)} className={`flex items-center gap-3 font-black text-sm uppercase transition-all ${isThreadLiked ? 'text-rojo-500 scale-110' : 'text-slate-500 hover:text-rojo-400'}`}>
                  <svg className={`w-7 h-7 ${isThreadLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {thread.likes}
                </button>
                <button onClick={() => setShowReportModal({type: ReportType.THREAD, targetId: thread.id, author: thread.authorName})} className="text-[10px] font-black uppercase text-slate-600 hover:text-rojo-500 tracking-widest transition-colors">Report Thread</button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-6">
          <div className="px-6 flex items-center gap-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 shrink-0">{threadPosts.length} Active Replies</h2>
             <div className="h-px w-full bg-rojo-900/10"></div>
          </div>
          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser?.id || '');
            const postAuthor = users.find(u => u.id === post.authorId);
            const isPostAuthorBanned = postAuthor?.status === 'Banned';
            return (
              <div key={post.id} className={`border rounded-[3rem] overflow-hidden flex transition-all ${isDark ? 'bg-black/10 border-rojo-900/10' : 'bg-white border-slate-50 shadow-sm'}`}>
                <div className={`w-20 md:w-40 p-8 flex flex-col items-center border-r shrink-0 ${isDark ? 'bg-rojo-950/5 border-rojo-900/5' : 'bg-slate-50/30'}`}>
                  <Link to={`/profile/${post.authorId}`} className="group relative">
                    <img src={isPostAuthorBanned ? DEFAULT_AVATAR : postAuthor?.avatarUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] border-2 border-rojo-900/10 shadow-lg group-hover:scale-105 transition-transform" alt="" />
                  </Link>
                  <Link to={`/profile/${post.authorId}`} className={`text-[10px] font-black mt-4 truncate w-full text-center hover:text-rojo-500 transition-colors ${isPostAuthorBanned ? 'line-through opacity-40' : 'text-slate-500'}`}>@{post.authorName}</Link>
                </div>
                <div className="flex-1 p-8 min-w-0 flex flex-col">
                  {editingPostId === post.id ? (
                    <div className="space-y-4">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full p-6 rounded-3xl border text-sm outline-none bg-rojo-950/20 text-white" rows={5} />
                      <div className="flex gap-3"><button onClick={() => { updatePost(post.id, editText); setEditingPostId(null); }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase">Save</button><button onClick={() => setEditingPostId(null)} className="px-6 py-2 bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase">Cancel</button></div>
                    </div>
                  ) : <div className="flex-1 text-sm leading-relaxed mb-6"><MediaRenderer content={post.content} isBanned={isPostAuthorBanned} /></div>}
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600 border-t border-rojo-900/5 pt-4">
                     <div className="flex items-center gap-6">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {(post.authorId === currentUser?.id || isAdmin) && !editingPostId && (
                           <div className="flex items-center gap-4">
                              <button onClick={() => { setEditingPostId(post.id); setEditText(post.content); }} className="hover:text-rojo-500 transition-colors">Edit</button>
                              <button onClick={() => { if(window.confirm('Delete post?')) deletePost(post.id); }} className="text-rojo-500">Delete</button>
                           </div>
                        )}
                     </div>
                     <div className="flex items-center gap-6">
                        <button onClick={() => likePost(post.id)} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-rojo-500 scale-110' : 'hover:text-rojo-400'}`}>
                          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button onClick={() => setShowReportModal({type: ReportType.POST, targetId: post.id, author: post.authorName})} className="hover:text-rojo-500">Flag</button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Box */}
        {currentUser && !thread.isLocked && (
          <div className={`border rounded-[3rem] p-12 transition-all shadow-2xl ${isDark ? 'bg-black/40 border-rojo-900/30' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Discussion Terminal</h3>
               <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 rounded-full bg-rojo-950/20 text-rojo-500 hover:bg-rojo-600 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest shadow-xl">Attach Media</button>
               <input type="file" ref={fileInputRef} onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file && file.size < MAX_FILE_SIZE) {
                   const r = new FileReader();
                   r.onload = ev => setPendingMedia([...pendingMedia, ev.target?.result as string]);
                   r.readAsDataURL(file);
                 } else if(file) alert('Max 5MB');
               }} className="hidden" multiple />
            </div>
            {pendingMedia.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-8 p-6 bg-rojo-950/10 rounded-[2rem] border border-dashed border-rojo-900/20">
                {pendingMedia.map((d, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-rojo-900/20">
                    <img src={d} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPendingMedia(pendingMedia.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-rojo-600 text-white rounded-full p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ))}
              </div>
            )}
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} className={`w-full h-44 rounded-[2.5rem] p-8 text-sm outline-none mb-8 border transition-all ${isDark ? 'bg-rojo-950/20 border-rojo-900/20 focus:ring-4 ring-rojo-500/10 text-white' : 'bg-slate-50/50 focus:ring-4 ring-rojo-500/5 border-slate-100'}`} placeholder="Submit your input to the discourse..." />
            <div className="flex justify-end"><button onClick={handleReply} disabled={isSubmitting || (!replyText.trim() && pendingMedia.length === 0)} className="bg-rojo-600 text-white px-16 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-rojo-500 shadow-2xl shadow-rojo-500/20 disabled:opacity-10 transition-all hover:scale-[1.02]">Broadcast Reply</button></div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-in zoom-in duration-200">
             <div className="w-full max-w-lg rounded-[2.5rem] p-10 bg-[#050101] border border-rojo-900/50 shadow-2xl">
                <h2 className="text-2xl font-black uppercase text-rojo-600 tracking-tighter mb-8">Flag Content</h2>
                <p className="text-slate-500 text-xs font-bold uppercase mb-6">Reporting user: @{showReportModal.author}</p>
                <div className="space-y-6">
                   <textarea value={reportContext} onChange={e => setReportContext(e.target.value)} className="w-full bg-black border border-rojo-900/30 rounded-3xl p-6 text-sm text-white focus:ring-2 ring-rojo-600 outline-none" rows={4} placeholder="Describe the violation..." />
                   <div className="flex gap-4">
                      <button onClick={() => setShowReportModal(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Dismiss</button>
                      <button onClick={handleReport} className="flex-1 bg-rojo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rojo-500 transition-all shadow-xl shadow-rojo-900/30">Submit Flag</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ThreadDetailPage;
