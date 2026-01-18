
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { ReportType } from '../types';
import { DEFAULT_AVATAR } from '../constants';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit

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
            return <div key={i} className="my-4"><img src={part} alt="Post content" className="max-h-[600px] rounded-xl border border-zinc-800 shadow object-contain bg-zinc-900" loading="lazy" /></div>;
          }
          if (lowerPart.match(/\.(mp4|webm|ogg|mov)/) || lowerPart.startsWith('data:video/')) {
            return <div key={i} className="my-4"><video controls className="max-h-[600px] w-full rounded-xl border border-zinc-800 shadow bg-zinc-900"><source src={part} /></video></div>;
          }
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
          const youtubeMatch = part.match(youtubeRegex);
          if (youtubeMatch) {
            return <div key={i} className="my-4 aspect-video w-full"><iframe className="w-full h-full rounded-xl shadow border border-zinc-800" src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} frameBorder="0" allowFullScreen></iframe></div>;
          }
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-rojo-600 font-bold hover:underline break-all">{part}</a>;
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

  if (!thread) return <Layout><div className="p-20 text-center text-zinc-500">Thread not found.</div></Layout>;

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
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="text-zinc-500 hover:text-rojo-600 text-xs font-bold uppercase transition-colors flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Discussions
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => toggleThreadPin(thread.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${thread.isPinned ? 'bg-rojo-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{thread.isPinned ? 'Pinned' : 'Pin'}</button>
              <button onClick={() => toggleThreadLock(thread.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${thread.isLocked ? 'bg-rojo-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{thread.isLocked ? 'Locked' : 'Lock'}</button>
              <button onClick={() => { if(window.confirm('Delete thread?')) { deleteThread(thread.id); navigate('/'); } }} className="px-4 py-1.5 bg-zinc-800 text-rojo-600 rounded-lg text-[10px] font-bold uppercase hover:bg-rojo-600 hover:text-white transition-all">Delete</button>
            </div>
          )}
        </div>

        {/* Original Post */}
        <div className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-56 p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r ${isDark ? 'bg-zinc-950 border-zinc-800/50' : 'bg-zinc-50 border-zinc-100'}`}>
              <Link to={`/profile/${thread.authorId}`} className="group">
                <img src={isThreadAuthorBanned ? DEFAULT_AVATAR : (threadAuthor?.avatarUrl || DEFAULT_AVATAR)} className="w-20 h-20 rounded-xl border border-zinc-800 shadow group-hover:border-rojo-600 transition-colors" alt="" />
              </Link>
              <Link to={`/profile/${thread.authorId}`} className={`font-bold text-sm mt-4 block truncate w-full hover:text-rojo-600 transition-colors ${isThreadAuthorBanned ? 'line-through opacity-50' : ''}`}>@{thread.authorName}</Link>
              <span className="text-[10px] font-bold uppercase text-zinc-500 mt-1">Author</span>
            </div>
            <div className="flex-1 p-8 flex flex-col min-w-0">
              <div className="flex items-start justify-between mb-6">
                <h1 className={`text-2xl font-black tracking-tight leading-tight ${isThreadAuthorBanned ? 'line-through opacity-40' : ''}`}>{isThreadAuthorBanned ? censorText(thread.title) : thread.title}</h1>
                <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0 pt-1">{new Date(thread.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={`mb-8 flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                <MediaRenderer content={thread.content} isBanned={isThreadAuthorBanned} />
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <button onClick={() => likeThread(thread.id)} className={`flex items-center gap-2 text-xs font-bold uppercase transition-all ${isThreadLiked ? 'text-rojo-600' : 'text-zinc-500 hover:text-rojo-600'}`}>
                  <svg className={`w-5 h-5 ${isThreadLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {thread.likes} Likes
                </button>
                <button onClick={() => setShowReportModal({type: ReportType.THREAD, targetId: thread.id, author: thread.authorName})} className="text-[10px] font-bold uppercase text-zinc-500 hover:text-rojo-600 transition-colors">Report Thread</button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 px-2">
             <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{threadPosts.length} Replies</h2>
             <div className="h-px flex-1 bg-zinc-800/50"></div>
          </div>
          {threadPosts.map(post => {
            const isLiked = post.likedBy?.includes(currentUser?.id || '');
            const postAuthor = users.find(u => u.id === post.authorId);
            const isPostAuthorBanned = postAuthor?.status === 'Banned';
            return (
              <div key={post.id} className={`border rounded-xl flex transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <div className={`w-20 md:w-32 p-6 flex flex-col items-center border-r shrink-0 ${isDark ? 'bg-zinc-950/20' : 'bg-zinc-50/50'}`}>
                  <Link to={`/profile/${post.authorId}`}>
                    <img src={isPostAuthorBanned ? DEFAULT_AVATAR : (postAuthor?.avatarUrl || DEFAULT_AVATAR)} className="w-12 h-12 rounded-lg border border-zinc-800 shadow" alt="" />
                  </Link>
                  <Link to={`/profile/${post.authorId}`} className={`text-[10px] font-bold mt-3 truncate w-full text-center hover:text-rojo-600 ${isPostAuthorBanned ? 'line-through opacity-40 text-zinc-600' : 'text-zinc-500'}`}>@{post.authorName}</Link>
                </div>
                <div className="flex-1 p-6 min-w-0 flex flex-col">
                  {editingPostId === post.id ? (
                    <div className="space-y-4">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full p-4 rounded-xl border text-sm outline-none bg-black border-zinc-800 text-white" rows={4} />
                      <div className="flex gap-2">
                        <button onClick={() => { updatePost(post.id, editText); setEditingPostId(null); }} className="px-4 py-1.5 bg-rojo-600 text-white rounded-lg text-xs font-bold uppercase">Save</button>
                        <button onClick={() => setEditingPostId(null)} className="px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold uppercase">Cancel</button>
                      </div>
                    </div>
                  ) : <div className="flex-1 text-sm leading-relaxed mb-4"><MediaRenderer content={post.content} isBanned={isPostAuthorBanned} /></div>}
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-t border-zinc-800/50 pt-4">
                     <div className="flex items-center gap-4">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {(post.authorId === currentUser?.id || isAdmin) && !editingPostId && (
                           <div className="flex items-center gap-4">
                              <button onClick={() => { setEditingPostId(post.id); setEditText(post.content); }} className="hover:text-rojo-600">Edit</button>
                              <button onClick={() => { if(window.confirm('Delete post?')) deletePost(post.id); }} className="text-rojo-600">Delete</button>
                           </div>
                        )}
                     </div>
                     <div className="flex items-center gap-4">
                        <button onClick={() => likePost(post.id)} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-rojo-600' : 'hover:text-rojo-600'}`}>
                          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </button>
                        <button onClick={() => setShowReportModal({type: ReportType.POST, targetId: post.id, author: post.authorName})} className="hover:text-rojo-600">Report</button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Editor */}
        {currentUser && !thread.isLocked && (
          <div className={`border rounded-2xl p-8 transition-all shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-bold uppercase tracking-wider">Leave a Reply</h3>
               <button onClick={() => fileInputRef.current?.click()} className="text-zinc-500 hover:text-rojo-600 font-bold uppercase text-[10px] tracking-wider transition">Add Media</button>
               <input type="file" ref={fileInputRef} onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file && file.size < MAX_FILE_SIZE) {
                   const r = new FileReader();
                   r.onload = ev => setPendingMedia([...pendingMedia, ev.target?.result as string]);
                   r.readAsDataURL(file);
                 } else if(file) alert('Max file size is 5MB.');
               }} className="hidden" multiple />
            </div>
            {pendingMedia.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-black/40 rounded-xl border border-zinc-800">
                {pendingMedia.map((d, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-800">
                    <img src={d} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPendingMedia(pendingMedia.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-rojo-600 text-white rounded-full p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ))}
              </div>
            )}
            <textarea 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)} 
              className={`w-full h-32 rounded-xl p-6 text-sm outline-none mb-6 border transition-all ${isDark ? 'bg-black border-zinc-800 focus:ring-1 ring-rojo-600 text-white' : 'bg-zinc-50 border-zinc-200 focus:ring-1 ring-rojo-600'}`} 
              placeholder="What do you think?" 
            />
            <div className="flex justify-end">
              <button 
                onClick={handleReply} 
                disabled={isSubmitting || (!replyText.trim() && pendingMedia.length === 0)} 
                className="bg-rojo-600 text-white px-10 py-2.5 rounded-xl font-bold uppercase text-xs hover:bg-rojo-500 shadow-md shadow-rojo-900/10 disabled:opacity-30 transition-all"
              >
                Post Reply
              </button>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="w-full max-w-md rounded-2xl p-8 bg-zinc-950 border border-zinc-800 shadow-2xl">
                <h2 className="text-xl font-bold uppercase text-rojo-600 mb-6">Report Content</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase mb-4">Target: @{showReportModal.author}</p>
                <div className="space-y-4">
                   <textarea 
                     value={reportContext} 
                     onChange={e => setReportContext(e.target.value)} 
                     className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white focus:ring-1 ring-rojo-600 outline-none" 
                     rows={4} 
                     placeholder="Please provide details about the violation..." 
                   />
                   <div className="flex gap-3">
                      <button onClick={() => setShowReportModal(null)} className="flex-1 py-3 text-zinc-500 font-bold uppercase text-xs tracking-wider">Cancel</button>
                      <button onClick={handleReport} className="flex-1 bg-rojo-600 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-rojo-500 transition-all">Submit Report</button>
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