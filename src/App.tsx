import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Save, Clock, Trash2, X, Bookmark, BookmarkPlus, Play, LogIn, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';
import { TimeBlock, RoutineTemplate, CategoryName } from './types';
import { CATEGORIES, HOUR_HEIGHT, MINUTE_HEIGHT } from './constants';
import { supabase } from './lib/supabase';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function App() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  
  const [modalForm, setModalForm] = useState<{
    title: string;
    category: CategoryName;
    startHour: number;
    durationHours: number;
  }>({
    title: '',
    category: 'Deep Work',
    startHour: 8,
    durationHours: 1,
  });

  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Supabase Auth State
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (user) {
      await supabase.auth.signOut();
    } else {
      const email = prompt('Enter your email to sign in via Magic Link:');
      if (email) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          alert('Error: ' + error.message);
        } else {
          alert('Check your email for the login link!');
        }
      }
    }
  };

  // Load from local storage on initial mount
  useEffect(() => {
    const savedBlocks = localStorage.getItem('daily-blocks');
    const savedTemplates = localStorage.getItem('daily-templates');
    if (savedBlocks) setBlocks(JSON.parse(savedBlocks));
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
  }, []);

  // Sync with Supabase on user login
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setIsSyncing(true);
        const { data, error } = await supabase
          .from('user_data')
          .select('blocks, templates')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setBlocks(data.blocks || []);
          setTemplates(data.templates || []);
          localStorage.setItem('daily-blocks', JSON.stringify(data.blocks || []));
          localStorage.setItem('daily-templates', JSON.stringify(data.templates || []));
        } else if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user data:", error);
        }
        setIsSyncing(false);
      };
      
      fetchUserData();
    }
  }, [user]);

  const saveToSupabase = async (b: TimeBlock[], t: RoutineTemplate[]) => {
    if (!user) return;
    setIsSyncing(true);
    const { error } = await supabase.from('user_data').upsert({
      user_id: user.id,
      blocks: b,
      templates: t,
      updated_at: new Date().toISOString()
    });
    if (error) console.error("Error saving to Supabase", error);
    setIsSyncing(false);
  };

  const handleSetBlocks = (newBlocks: TimeBlock[]) => {
    setBlocks(newBlocks);
    localStorage.setItem('daily-blocks', JSON.stringify(newBlocks));
    saveToSupabase(newBlocks, templates);
  };

  const handleSetTemplates = (newTemplates: RoutineTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('daily-templates', JSON.stringify(newTemplates));
    saveToSupabase(blocks, newTemplates);
  };

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
      const scrollPosition = currentHour * HOUR_HEIGHT - window.innerHeight / 2;
      timelineRef.current.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  }, []);

  const openModal = (block?: TimeBlock, startHour?: number) => {
    if (block) {
      setEditingBlock(block);
      setModalForm({
        title: block.title,
        category: block.category,
        startHour: block.startHour,
        durationHours: block.durationHours,
      });
    } else {
      setEditingBlock(null);
      setModalForm({
        title: '',
        category: 'Deep Work',
        startHour: startHour ?? 8,
        durationHours: 1,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlock(null);
  };

  const saveBlock = () => {
    if (!modalForm.title.trim()) return;
    
    if (editingBlock) {
      handleSetBlocks(blocks.map(b => b.id === editingBlock.id ? { ...b, ...modalForm } : b));
    } else {
      handleSetBlocks([...blocks, { id: generateId(), ...modalForm }]);
    }
    closeModal();
  };

  const deleteBlock = (id: string) => {
    handleSetBlocks(blocks.filter(b => b.id !== id));
    closeModal();
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking exactly on the timeline grid, not on a block
    if (e.target !== e.currentTarget) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Snap to nearest 30 mins
    const rawHour = y / HOUR_HEIGHT;
    const snappedHour = Math.floor(rawHour * 2) / 2;
    
    openModal(undefined, snappedHour);
  };

  const saveTemplate = () => {
    const name = prompt('Enter a name for this routine template:');
    if (name) {
      handleSetTemplates([...templates, { id: generateId(), name, blocks }]);
    }
  };

  const loadTemplate = (template: RoutineTemplate) => {
    if (window.confirm(`Load template "${template.name}"? This will replace your current day.`)) {
      handleSetBlocks(template.blocks);
    }
  };

  const deleteTemplate = (id: string) => {
    if (window.confirm('Delete this template?')) {
      handleSetTemplates(templates.filter(t => t.id !== id));
    }
  };

  const formatHour = (hourObj: number) => {
    const h = Math.floor(hourObj);
    const m = Math.round((hourObj - h) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m === 0 ? '00' : '30';
    return `${displayH}:${displayM} ${ampm}`;
  };

  const currentHourFloat = currentTime.getHours() + currentTime.getMinutes() / 60;

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col z-20 shadow-2xl">
        <div className="p-6 border-b border-white/10 relative">
          <div className="flex items-center gap-3 text-xl font-medium tracking-tight mb-6 mt-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            <span>TimeBlktr</span>
          </div>

          {user && (
            <div className="absolute top-6 right-6 text-xs flex items-center gap-1.5 text-neutral-500" title={isSyncing ? "Syncing..." : "Synced to cloud"}>
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
              ) : (
                <Cloud className="w-4 h-4 text-emerald-500/80" />
              )}
            </div>
          )}
          
          <button 
            onClick={() => openModal()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 px-4 rounded-xl transition-all duration-200 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Block
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Categories</h3>
            <div className="space-y-2">
              {Object.values(CATEGORIES).map(cat => (
                <div key={cat.name} className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className={cn("w-3 h-3 rounded-full border", cat.bgClass, cat.borderClass)}></div>
                  {cat.name}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Routines</h3>
              <button onClick={saveTemplate} className="text-indigo-400 hover:text-indigo-300 transition-colors p-1" title="Save Current as Routine">
                <BookmarkPlus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-neutral-600 italic">No templates saved.</p>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="group flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                    <button onClick={() => loadTemplate(t)} className="flex items-center gap-2 text-sm text-neutral-300 hover:text-white flex-1 text-left">
                      <Bookmark className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400" />
                      {t.name}
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 mt-auto">
          <button 
            onClick={handleAuth}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-neutral-300 py-2.5 px-4 rounded-xl transition-all duration-200 text-sm font-medium border border-white/5"
          >
            {user ? (
              <>
                <LogOut className="w-4 h-4" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In Sync
              </>
            )}
          </button>
          {user && (
            <p className="text-xs text-center text-neutral-500 mt-2 truncate">
              {user.email}
            </p>
          )}
        </div>
      </aside>

      {/* Main Timeline Area */}
      <main ref={timelineRef} className="flex-1 overflow-y-auto no-scrollbar relative bg-neutral-900/50">
        <div className="relative min-w-full" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          
          {/* Timeline Grid (Background) */}
          <div className="absolute inset-0 z-0 select-nonepointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute w-full border-t border-white/5 flex items-start"
                style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <div className="w-20 pl-4 pt-2 text-xs text-neutral-500 font-mono tracking-wider">
                  {formatHour(i)}
                </div>
                {/* 30 min dashed line */}
                <div className="absolute w-full border-t border-white/5 border-dashed" style={{ top: `${HOUR_HEIGHT / 2}px` }}></div>
              </div>
            ))}
          </div>

          {/* Clickable Area for creating blocks */}
          <div 
            className="absolute inset-0 ml-20 z-10 cursor-crosshair"
            onClick={handleTimelineClick}
          />

          {/* Time Blocks */}
          {blocks.map(block => {
            const cat = CATEGORIES[block.category];
            // Compute CSS top and height
            const top = block.startHour * HOUR_HEIGHT;
            const height = block.durationHours * HOUR_HEIGHT;
            
            return (
              <div
                key={block.id}
                onClick={() => openModal(block)}
                className={cn(
                  "absolute left-24 right-8 rounded-xl border backdrop-blur-md p-3 cursor-pointer transition-all hover:brightness-110 hover:shadow-lg z-20 group",
                  cat.bgClass, cat.borderClass
                )}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <div className={cn("text-xs font-semibold uppercase tracking-wider mb-1", cat.colorClass)}>
                    {block.category}
                  </div>
                  <div className="text-sm font-medium text-white truncate">
                    {block.title}
                  </div>
                  <div className="mt-auto text-xs text-white/50 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{formatHour(block.startHour)} - {formatHour(block.startHour + block.durationHours)}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Current Time Indicator */}
          <div 
            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
            style={{ top: `${currentHourFloat * HOUR_HEIGHT}px` }}
          >
            <div className="w-20 pr-2 flex justify-end">
              <span className="text-xs font-mono font-bold text-red-500 bg-neutral-950 px-1 rounded">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex-1 border-t-2 border-red-500 opacity-80 shadow-[0_0_8px_rgba(239,68,68,0.8)] relative">
               <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal for Create/Edit Frame */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-medium tracking-tight">
                {editingBlock ? 'Edit Block' : 'New Block'}
              </h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex-1">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold block">Title</label>
                <input 
                  type="text" 
                  value={modalForm.title}
                  onChange={e => setModalForm({...modalForm, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="What are you doing?"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(CATEGORIES).map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setModalForm({...modalForm, category: cat.name})}
                      className={cn(
                        "px-3 py-2 border rounded-lg text-sm transition-all flex items-center gap-2",
                        modalForm.category === cat.name 
                          ? cn(cat.bgClass, cat.borderClass, "text-white") 
                          : "bg-black/30 border-white/5 text-neutral-400 hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", cat.bgClass, cat.borderClass, "border")}></div>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold block">Start Time</label>
                  <select 
                    value={modalForm.startHour}
                    onChange={e => setModalForm({...modalForm, startHour: parseFloat(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({length: 48}).map((_, i) => {
                      const h = i / 2;
                      return <option key={h} value={h}>{formatHour(h)}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold block">Duration</label>
                  <select 
                    value={modalForm.durationHours}
                    onChange={e => setModalForm({...modalForm, durationHours: parseFloat(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map(h => (
                      <option key={h} value={h}>
                        {h} {h === 1 ? 'hour' : 'hours'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex justify-between items-center bg-black/20">
              {editingBlock ? (
                <button 
                  onClick={() => deleteBlock(editingBlock.id)}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              ) : <div></div>}
              
              <div className="flex gap-3">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveBlock}
                  disabled={!modalForm.title.trim()}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:text-white/50 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
