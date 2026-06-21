import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import VideoUploader from '../components/VideoUploader';

export default function HomePage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [composeMediaUrl, setComposeMediaUrl] = useState('');
  const [composeMediaType, setComposeMediaType] = useState<'video'|'image'|null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        handleNewPost(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles(name, avatar_url)`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
      
      if (user && data) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map((p: any) => p.id));
        if (likes) {
          setLikedPosts(new Set(likes.map((l: any) => l.post_id)));
        }
      }
    } catch (err) {
      console.error('Error fetching posts', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const liked = likedPosts.has(postId);
    if (liked) {
      await supabase.from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setLikedPosts(prev => {
        const n = new Set(prev); n.delete(postId); return n;
      });
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: Math.max(0, (p.likes_count||0) - 1) } 
          : p
      ));
    } else {
      await supabase.from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: (p.likes_count||0) + 1 } 
          : p
      ));
    }
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleNewPost = async (newPost: any) => {
    // Need to fetch author details for the new post
    const { data } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', newPost.user_id)
      .single();
      
    const postWithProfile = { ...newPost, profiles: data };
    setPosts(prev => [postWithProfile, ...prev]);
  };

  const submitPost = async () => {
    if (!user || (!composeText.trim() && !composeMediaUrl)) return;
    
    setUploadingMedia(true);
    await supabase.from('posts').insert({
      user_id: user.id,
      content: composeText.trim(),
      video_url: composeMediaType === 'video' ? composeMediaUrl : null,
      image_url: composeMediaType === 'image' ? composeMediaUrl : null,
    });
    
    setComposeText('');
    setComposeMediaUrl('');
    setComposeMediaType(null);
    setShowComposer(false);
    setUploadingMedia(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#2A2A2A] z-30 flex items-center justify-between px-4 max-w-md mx-auto relative content-container">
        <h1 className="font-syne font-extrabold text-xl text-white">Community</h1>
        {/* BELL Placeholder */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#0A0A0A]"></div>
        </div>
      </header>

      {/* FEED */}
      <div className="pt-20 px-4 pb-24 flex flex-col gap-3">
        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1A1A1A] h-48 rounded-2xl"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-[#1A1A1A] p-6 rounded-2xl text-center">
            <p className="text-gray-400 font-inter">No posts yet. Be the first to share your challenge! 💪</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-[#1A1A1A] p-4 rounded-2xl mb-3 border border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center font-bold text-[#aaa]">
                      {post.profiles?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <div className="text-white font-inter font-semibold text-[15px] leading-tight">{post.profiles?.name || 'User'}</div>
                    <div className="text-[#666666] font-inter text-xs leading-tight mt-[2px]">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                {user?.id === post.user_id && (
                  <button 
                    onClick={() => deletePost(post.id)}
                    className="text-[#666] p-1 hover:text-red-400 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                  </button>
                )}
              </div>

              {post.content && (
                <p className="text-white text-[15px] leading-[1.6] font-inter mb-3 whitespace-pre-wrap">{post.content}</p>
              )}

              {post.image_url && (
                <img src={post.image_url} alt="Post media" className="w-full max-h-[280px] object-cover rounded-xl mb-3" />
              )}
              {post.video_url && (
                <video src={post.video_url} controls preload="metadata" className="w-full max-h-[280px] object-cover rounded-xl mb-3 shadow-md" />
              )}

              {post.share_card_data && (
                <div className="bg-[#0A0A0A] rounded-xl border border-[#00E87A]/30 p-4 mb-3">
                   <div className="font-syne font-bold text-white text-lg">{post.share_card_data.value}{post.share_card_data.unit} {post.share_card_data.challenge}</div>
                   <div className="text-[#00E87A] font-inter font-medium text-sm mt-1">{post.share_card_data.streak} day streak 🔥</div>
                </div>
              )}

              <div className="flex items-center gap-6 mt-3 pt-3 border-t border-[#2A2A2A]">
                 <button 
                   onClick={() => toggleLike(post.id)}
                   className="flex items-center gap-2 font-semibold text-sm"
                   style={{ color: likedPosts.has(post.id) ? '#00E87A' : '#aaa' }}
                 >
                   <svg width="20" height="20" viewBox="0 0 24 24" 
                     fill={likedPosts.has(post.id) ? '#00E87A' : 'none'} 
                     stroke="currentColor" strokeWidth="2">
                     <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                   </svg>
                   {post.likes_count || 0}
                 </button>
                 <button className="flex items-center gap-2 text-[#aaa] font-semibold text-sm">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                   {post.comments_count || 0}
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => setShowComposer(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#00E87A] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,232,122,0.3)] z-20 transition-transform active:scale-95"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>

      {/* COMPOSER SHEET */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowComposer(false)}></div>
          <div className="bg-[#1A1A1A] rounded-t-3xl p-6 relative w-full max-w-md mx-auto animate-fade-in border-t border-[#333]">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-syne font-extrabold text-xl text-white">Share with the community</h3>
               <button onClick={() => setShowComposer(false)} className="text-[#888]">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
             </div>
             
             <textarea 
               className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 text-white text-[15px] font-inter min-h-[100px] mb-4 focus:outline-none focus:border-[#00E87A] resize-none"
               placeholder="What did you do today?"
               value={composeText}
               onChange={e => setComposeText(e.target.value)}
             />

             {!composeMediaUrl && user && (
               <div className="mb-6">
                 <VideoUploader 
                   userId={user.id} 
                   onUpload={(url) => { setComposeMediaUrl(url); setComposeMediaType('video'); }} 
                 />
               </div>
             )}

             <button 
               onClick={submitPost}
               disabled={uploadingMedia || (!composeText.trim() && !composeMediaUrl)}
               className="w-full bg-[#00E87A] text-black font-bold py-4 rounded-full disabled:opacity-50"
             >
               {uploadingMedia ? 'Posting...' : 'Post'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
