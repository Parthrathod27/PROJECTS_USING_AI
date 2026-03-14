import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Video, 
  PlusSquare, 
  Search as SearchIcon, 
  User as UserIcon, 
  MapPin, 
  AlertTriangle, 
  Send,
  Camera,
  X,
  Edit2,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface User {
  id: number;
  name: string;
  bio: string;
  profile_pic: string;
}

interface Post {
  id: number;
  user_id: number;
  user_name: string;
  user_pic: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video';
  lat: number;
  lon: number;
  city: string;
  timestamp: string;
}

interface NewsItem {
  id: number;
  title: string;
  description: string;
  url: string;
  url_to_image: string;
  published_at: string;
  source_name: string;
}

// --- Utils ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'videos', icon: Video, label: 'Videos' },
    { id: 'create', icon: PlusSquare, label: 'Create' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center p-2 transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <tab.icon size={24} />
          <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [safetyAlert, setSafetyAlert] = useState<Post | null>(null);

  useEffect(() => {
    fetchUser();
    fetchPosts();
    fetchNews();
    getUserLocation();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/user');
    const data = await res.json();
    setUser(data);
  };

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
    checkForSafetyAlerts(data);
  };

  const fetchNews = async () => {
    const res = await fetch('/api/news');
    const data = await res.json();
    setNews(data);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      });
    }
  };

  const checkForSafetyAlerts = (allPosts: Post[]) => {
    if (!location) return;
    const keywords = ["Accident", "Fire", "Protest", "Emergency", "Warning"];
    const nearbyAlert = allPosts.find(p => {
      const dist = calculateDistance(location.lat, location.lon, p.lat, p.lon);
      const hasKeyword = keywords.some(k => p.content.toLowerCase().includes(k.toLowerCase()));
      return dist < 2 && hasKeyword;
    });
    if (nearbyAlert) setSafetyAlert(nearbyAlert);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-40">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">BeUpdated</h1>
        <div className="flex items-center space-x-2">
          <MapPin size={18} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-600">Nearby Alerts Active</span>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeSection key="home" posts={posts} news={news} location={location} safetyAlert={safetyAlert} />}
          {activeTab === 'videos' && <VideosSection key="videos" posts={posts} />}
          {activeTab === 'create' && <CreateSection key="create" onPostSuccess={fetchPosts} location={location} />}
          {activeTab === 'search' && <SearchSection key="search" />}
          {activeTab === 'profile' && <ProfileSection key="profile" user={user} posts={posts} onUpdate={fetchUser} />}
        </AnimatePresence>
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// --- Home Section ---
const HomeSection = ({ posts, news, location, safetyAlert }: { posts: Post[], news: NewsItem[], location: any, safetyAlert: Post | null }) => {
  const nearbyPosts = posts.filter(p => {
    if (!location) return false;
    return calculateDistance(location.lat, location.lon, p.lat, p.lon) < 10;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="p-4 space-y-6"
    >
      {/* Safety Notification */}
      {safetyAlert && (
        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-start space-x-3 animate-pulse">
          <AlertTriangle className="flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-sm">SAFETY NOTIFICATION</h3>
            <p className="text-xs opacity-90">{safetyAlert.content}</p>
            <p className="text-[10px] mt-1 font-mono">Location: {safetyAlert.city} (Within 2km)</p>
          </div>
        </div>
      )}

      {/* Local Alerts */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Local Alerts (Within 10km)</h2>
        <div className="space-y-4">
          {nearbyPosts.length > 0 ? nearbyPosts.map(post => (
            <div key={post.id} className="bg-white border-2 border-red-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-3 flex items-center space-x-2 border-b border-gray-50">
                <img src={post.user_pic} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <p className="text-xs font-bold">{post.user_name}</p>
                  <p className="text-[10px] text-gray-400">{post.city} • {new Date(post.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>
              </div>
              {post.media_url && (
                <div className="aspect-video bg-gray-100">
                  {post.media_type === 'image' ? (
                    <img src={post.media_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <video src={post.media_url} controls className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400">No local alerts in your area</p>
            </div>
          )}
        </div>
      </section>

      {/* World News */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">World News</h2>
        <div className="space-y-4">
          {news.map(item => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <img src={item.url_to_image} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">{item.source_name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(item.published_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

// --- Videos Section ---
const VideosSection = ({ posts }: { posts: Post[] }) => {
  const videoPosts = posts.filter(p => p.media_type === 'video');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-120px)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
    >
      {videoPosts.length > 0 ? videoPosts.map(post => (
        <div key={post.id} className="h-full w-full snap-start relative bg-black">
          <video 
            src={post.media_url} 
            className="w-full h-full object-contain" 
            autoPlay 
            loop 
            muted 
            playsInline
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <div className="flex items-center space-x-3 mb-3">
              <img src={post.user_pic} className="w-10 h-10 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
              <div>
                <p className="font-bold">@{post.user_name}</p>
                <p className="text-xs opacity-70">{post.city}</p>
              </div>
            </div>
            <p className="text-sm line-clamp-3">{post.content}</p>
          </div>
        </div>
      )) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
          <Video size={48} className="mb-4 opacity-20" />
          <p>No video news available yet</p>
        </div>
      )}
    </motion.div>
  );
};

// --- Create Section ---
const CreateSection = ({ onPostSuccess, location }: { onPostSuccess: () => void, location: any }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isPosting, setIsPosting] = useState(false);
  const [city, setCity] = useState('Unknown City');

  useEffect(() => {
    if (location) {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=json`)
        .then(res => res.json())
        .then(data => {
          setCity(data.address.city || data.address.town || data.address.village || 'Nearby');
        });
    }
  }, [location]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia(reader.result as string);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content) return;
    setIsPosting(true);
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          media_url: media,
          media_type: mediaType,
          lat: location?.lat || 0,
          lon: location?.lon || 0,
          city
        })
      });
      onPostSuccess();
      setContent('');
      setMedia(null);
      alert('Post shared successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4"
    >
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Create Alert</h2>
          <button onClick={() => setMedia(null)} className="text-gray-400"><X size={20} /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening? (e.g. Accident on Main St)"
            className="w-full h-32 p-4 bg-gray-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
          />

          {media ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100">
              {mediaType === 'image' ? (
                <img src={media} className="w-full h-full object-cover" />
              ) : (
                <video src={media} className="w-full h-full object-cover" />
              )}
              <button 
                onClick={() => setMedia(null)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera size={32} className="text-gray-300 mb-2" />
              <span className="text-xs text-gray-400">Add Photo or Video</span>
              <input type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
            </label>
          )}

          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-xl">
            <MapPin size={16} />
            <span className="text-xs font-medium">Sharing Live Location: {city}</span>
          </div>

          <button
            onClick={handlePost}
            disabled={isPosting || !content}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${isPosting || !content ? 'bg-gray-300' : 'bg-blue-600 active:scale-95'}`}
          >
            {isPosting ? 'Posting...' : <><Send size={18} /> <span>Share Alert</span></>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Search Section ---
const SearchSection = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setIsSearching(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-4 space-y-6"
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by City or User..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search Results</h3>
          {results.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex space-x-4">
              {post.media_url && post.media_type === 'image' && (
                <img src={post.media_url} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
              )}
              <div>
                <p className="text-xs font-bold text-blue-600">{post.city}</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-2 mt-1">{post.content}</p>
                <p className="text-[10px] text-gray-400 mt-2">By @{post.user_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSearching && <div className="text-center py-10 text-gray-400">Searching...</div>}
    </motion.div>
  );
};

// --- Profile Section ---
const ProfileSection = ({ user, posts, onUpdate }: { user: User | null, posts: Post[], onUpdate: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '', profile_pic: '' });

  useEffect(() => {
    if (user) setEditData({ name: user.name, bio: user.bio, profile_pic: user.profile_pic });
  }, [user]);

  const handleUpdate = async () => {
    await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    onUpdate();
    setIsEditing(false);
  };

  const myPosts = posts.filter(p => p.user_id === user?.id);

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-4 space-y-8"
    >
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <img src={user.profile_pic} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" referrerPolicy="no-referrer" />
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md"
          >
            <Edit2 size={14} />
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-[250px]">{user.bio}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center space-x-12 border-y border-gray-100 py-4">
        <div className="text-center">
          <p className="font-bold text-gray-900">{myPosts.length}</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Alerts</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">1.2k</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Followers</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">450</p>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Following</p>
        </div>
      </div>

      {/* Grid */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Grid size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800">My Alerts</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {myPosts.map(post => (
            <div key={post.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {post.media_url ? (
                post.media_type === 'image' ? (
                  <img src={post.media_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <Video size={20} className="text-white opacity-50" />
                  </div>
                )
              ) : (
                <div className="p-2 text-[8px] text-gray-400 line-clamp-4">{post.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4"
          >
            <h3 className="font-bold text-lg">Edit Profile</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-gray-400 uppercase">Name</span>
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-400 uppercase">Bio</span>
                <textarea 
                  value={editData.bio} 
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-400 uppercase">Profile Pic URL</span>
                <input 
                  type="text" 
                  value={editData.profile_pic} 
                  onChange={e => setEditData({...editData, profile_pic: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
            <div className="flex space-x-3 pt-2">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg">Save</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
