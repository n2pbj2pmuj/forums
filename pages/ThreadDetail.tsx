import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { ReportType } from '../types';
import { DEFAULT_AVATAR } from '../constants';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MediaRenderer: React.FC<{ content: string; isBanned: boolean }> = ({ content, isBanned }) => {
  if (isBanned) return <div className="font-mono break-all leading-relaxed opacity-60 italic">{censorText(content)}</div>;
  const mediaRegex = /(https?:\/\/[^\s]+|data:[^;]+;base64,[^\s]+)/g;
  const parts = content.split(mediaRegex);
  return (
    <div className="space-y-4 leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.match(mediaRegex)) {
          const lowerPart = part.toLowerCase();
          if (lowerPart.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)/) || lowerPart.startsWith('data:image/')) {
            return <div key={i} className="my-4"><img src={part} alt="" className="max-h-[600px] rounded-2xl border border-zinc-800 shadow-2xl object-contain bg-black/40" loading="lazy" /></div>;
          }
          if (lowerPart.match(/\.(mp4|webm|ogg|mov)/) || lowerPart.startsWith('data:video/')) {
            return <div key={i} className="my-4"><video controls className="max-h-[600px] w-full rounded-2xl border border-zinc-800 shadow-2xl bg-black/40"><source src={part} /></video></div>;
          }
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-rojo-600 font-black hover:underline break-all uppercase text-xs tracking-widest">{part}</a>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const ThreadDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { threads, posts, currentUser, theme, users, addPost, updatePost, addReport, toggleThreadPin, toggleThreadLock, deleteThread, likePost, likeThread, incrementThreadView, deletePost } = useAppState();
  
  const [replyText, setReplyText] = useState('');
  const [pendingMedia, setPendingMedia] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showReportModal, setShowReportModal] = useState<{type: ReportType, targetId: string, author: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thread = threads.find(t => t.id === id);
  const threadPosts = posts.filter(p => p.threadId === id);
  const isDark = theme === 'dark';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Moderator';

  useEffect(() => { if (id) incrementThreadView(id); }, [id]);

  if (!thread) return <Layout><div className="p-20 text-center text-zinc-500 font-black uppercase tracking-[0.4em]">ACCESS DENIED</div></Layout>;

  const handleReply = async () => {
    if ((!replyText.trim() && pendingMedia.length === 0) || isSubmitting || thread.isLocked) return;
    setIsSubmitting(true);
    const finalContent = [replyText.trim(), ...pendingMedia].filter(Boolean).join('\n\n');
    try {
      await addPost(thread.id, finalContent);
      setReplyText('');
      setPendingMedia([]);
    } catch (e) {
      console.error("Reply Error:", e);
    } finally { setIsSubmitting(false); }
  };

  const handleEditSave = async (postId: string) => {
    if (!editText.trim()) return;
    await updatePost(postId, editText);
    setEditingPostId(null);
  };

  const isThreadLiked = thread.likedBy?.includes(currentUser?.id || '');
  const threadAuthor = users.find(u => u.id === thread.authorId);
  const isThreadAuthorBanned = threadAuthor?.status === 'Banned';

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/50">
          <Link to="/" className="text-zinc-500 hover:text-rojo-600 text-[10px] font-black uppercase tracking-widest flex items-center transition-all">
            <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Community Hub
          </Link>
          <div className="flex items-center gap-2">
            {(thread.authorId === currentUser?.id || isAdmin) && (
              <>
                 {isAdmin && (
                   <>
                     <button onClick={() => toggleThreadPin(thread.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${thread.isPinned ? 'bg-rojo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500'}`}>{thread.isPinned ? 'UNPIN' : 'PIN'}</button>
                     <button onClick={() => toggleThreadLock(thread.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${thread.isLocked ? 'bg-rojo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-500'}`}>{thread.isLocked ? 'UNLOCK' : 'LOCK'}</button>
                   </>
                 )}
                 <button onClick={() => { if(window.confirm('Delete this entire thread?')) { deleteThread(thread.id); navigate('/'); } }} className="px-4 py-2 bg-zinc-900 border border-rojo-950 text-rojo-600 rounded-xl text-[9px] font-black uppercase hover:bg-rojo-600 hover:text-white transition-all">DELETE</button>
              </>
            )}
          </div>
        </div>

        {/* OP SECTION */}
        <div className={`rounded-[2.5rem] overflow-hidden border transition-all ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}>
          <div className="flex flex-col md:flex-row">
            <aside className={`w-full md:w-64 p-10 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="relative group">
                <Link to={`/profile/${thread.authorId}`}>
                   <img src={isThreadAuthorBanned ? DEFAULT_AVATAR : (threadAuthor?.avatarUrl || DEFAULT_AVATAR)} className="w-24 h-24 rounded-[2rem] border-4 border-zinc-800 shadow-2xl group-hover:border-rojo-600 transition-all object-cover" alt="" />
                </Link>
                {threadAuthor?.role === 'Admin' && <div className="absolute -top-1 -right-1 w-6 h-6 bg-rojo-600 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-lg">A</div>}
              </div>
              <Link to={`/profile/${thread.authorId}`} className={`font-black text-sm mt-6 block truncate w-full hover:text-rojo-600 transition-colors uppercase tracking-tight ${isThreadAuthorBanned ? 'line-through opacity-40' : ''}`}>@{thread.authorName}</Link>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mt-2">{threadAuthor?.role}</span>
              <div className="mt-8 space-y-2 w-full pt-6 border-t border-zinc-800/30">
                <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Joined {new Date(threadAuthor?.joinDate || '').getFullYear()}</p>
                <p className="text-[9px] font-black uppercase text-rojo-600 tracking-widest">{threadAuthor?.postCount} Posts</p>
              </div>
            </aside>
            <div className="flex-1 p-10 md:p-14 flex flex-col min-w-0">
              <div className="flex items-start justify-between gap-6 mb-10">
                <h1 className={`text-4xl font-black tracking-tighter leading-[1.1] ${isThreadAuthorBanned ? 'line-through opacity-40' : ''}`}>{isThreadAuthorBanned ? censorText(thread.title) : thread.title}</h1>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest shrink-0 pt-2">{new Date(thread.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={`mb-12 flex-1 text-base md:text-lg font-medium leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                <MediaRenderer content={thread.content} isBanned={isThreadAuthorBanned} />
              </div>
              <div className="flex items-center justify-between pt-10 border-t border-zinc-800/30">
                <button onClick={() => likeThread(thread.id)} className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${isThreadLiked ? 'text-rojo-500' : 'text-zinc-500 hover:text-rojo-600'}`}>
                  <svg className={`w-5 h-5 ${isThreadLiked ? 'fill-current scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {thread.likes} Likes
                </button>
                <button onClick={() => setShowReportModal({type: ReportType.THREAD, targetId: thread.id, author: thread.authorName})} className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:text-rojo-600 transition-all">Flag Content</button>
              </div>
            </div>
          </div>
        </div>

        {/* REPLIES AREA */}
        <div className="space-y-6">
          <div className="flex items-center gap-6 px-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">{threadPosts.length} COMMENTS</h2>
             <div className="h-[2px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent"></div>
          </div>

          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser?.id || '');
            const postAuthor = users.find(u => u.id === post.authorId);
            const isPostAuthorBanned = postAuthor?.status === 'Banned';
            const isOwner = post.authorId === currentUser?.id;

            return (
              <div key={post.id} className={`rounded-[2rem] flex border overflow-hidden transition-all ${isDark ? 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-100 shadow-md'}`}>
                <aside className={`w-24 md:w-40 p-6 md:p-8 flex flex-col items-center border-r shrink-0 ${isDark ? 'bg-black/20 border-zinc-800' : 'bg-zinc-50/50'}`}>
                  <Link to={`/profile/${post.authorId}`}>
                    <img src={isPostAuthorBanned ? DEFAULT_AVATAR : (postAuthor?.avatarUrl || DEFAULT_AVATAR)} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-zinc-800 shadow-xl object-cover" alt="" />
                  </Link>
                  <Link to={`/profile/${post.authorId}`} className={`text-[9px] font-black mt-4 truncate w-full text-center hover:text-rojo-600 uppercase tracking-tighter ${isPostAuthorBanned ? 'line-through opacity-40' : 'text-zinc-500'}`}>@{post.authorName}</Link>
                  <span className="text-[7px] font-black uppercase tracking-widest text-zinc-700 mt-1">{postAuthor?.role}</span>
                </aside>
                <div className="flex-1 p-8 md:p-10 min-w-0 flex flex-col">
                  {editingPostId === post.id ? (
                    <div className="mb-6 space-y-4">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white outline-none" rows={4} />
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSave(post.id)} className="bg-rojo-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase">Save</button>
                        <button onClick={() => setEditingPostId(null)} className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-lg text-[9px] font-black uppercase">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm md:text-base leading-relaxed mb-6"><MediaRenderer content={post.content} isBanned={isPostAuthorBanned} /></div>
                  )}
                  
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600 pt-6 border-t border-zinc-800/30">
                     <div className="flex items-center gap-6">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {(isOwner || isAdmin) && (
                          <div className="flex gap-4">
                             {isOwner && <button onClick={() => { setEditingPostId(post.id); setEditText(post.content); }} className="text-zinc-400 hover:text-white transition-all">Edit</button>}
                             <button onClick={() => { if(window.confirm('Delete reply?')) deletePost(post.id); }} className="text-rojo-900 hover:text-rojo-600 transition-all">Remove</button>
                          </div>
                        )}
                     </div>
                     <div className="flex items-center gap-6">
                        <button onClick={() => likePost(post.id)} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-rojo-600' : 'hover:text-rojo-600'}`}>
                          <svg className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button onClick={() => setShowReportModal({type: ReportType.POST, targetId: post.id, author: post.authorName})} className="hover:text-rojo-600">Flag</button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EDITOR */}
        {currentUser && !thread.isLocked && (
          <div className={`rounded-[2.5rem] p-12 transition-all border shadow-2xl ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Post a Reply</h3>
               <button onClick={() => fileInputRef.current?.click()} className="text-zinc-600 hover:text-rojo-600 font-black uppercase text-[10px] tracking-widest transition-all">Add Media</button>
               <input type="file" ref={fileInputRef} onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file && file.size < MAX_FILE_SIZE) {
                   const r = new FileReader();
                   r.onload = ev => setPendingMedia([...pendingMedia, ev.target?.result as string]);
                   r.readAsDataURL(file);
                 }
               }} className="hidden" />
            </div>
            
            {pendingMedia.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-8 p-6 bg-black/40 rounded-[1.5rem] border border-zinc-800">
                {pendingMedia.map((d, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                    <img src={d} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPendingMedia(pendingMedia.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-rojo-600 text-white rounded-full p-1.5 shadow-xl"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ))}
              </div>
            )}
            
            <textarea 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)} 
              className={`w-full h-40 rounded-[1.5rem] p-8 text-sm outline-none mb-8 border transition-all ${isDark ? 'bg-black border-zinc-800 focus:ring-2 ring-rojo-600 text-white shadow-inner' : 'bg-zinc-50 border-zinc-200 focus:ring-2 ring-rojo-600 shadow-inner'}`} 
              placeholder="Type your reply here..." 
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReply} 
                disabled={isSubmitting || (!replyText.trim() && pendingMedia.length === 0)} 
                className="bg-rojo-600 text-white px-14 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rojo-500 shadow-2xl shadow-rojo-950/40 disabled:opacity-20 transition-all transform active:scale-95"
              >
                {isSubmitting ? 'UPLOADING...' : 'POST REPLY'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ThreadDetailPage;