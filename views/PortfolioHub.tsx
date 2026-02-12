
import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Search, Loader2, Save, 
  ChevronRight, StickyNote, Activity, Database
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, Button } from '../components';

interface PortfolioItem {
  id: number;
  title: string;
  original_text: string;
  created_at: string;
}

const PortfolioHubView: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editor, setEditor] = useState({ title: '', text: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setItems(data);
      if (error) console.error("Error fetching entries:", error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const newItem = { title: 'New Portfolio Ledger Entry', original_text: '' };
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .insert([newItem])
        .select();
      
      if (data) {
        setItems([data[0], ...items]);
        setSelectedId(data[0].id);
        setEditor({ title: data[0].title, text: data[0].original_text });
      }
      if (error) console.error("Error creating entry:", error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (selectedId === null) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('entries')
        .update({ title: editor.title, original_text: editor.text })
        .eq('id', selectedId);
      
      if (!error) {
        setItems(prev => prev.map(item => item.id === selectedId ? { ...item, title: editor.title, original_text: editor.text } : item));
      } else {
        console.error("Error updating entry:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this entry from the ledger?")) return;
    try {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (!error) {
        setItems(prev => prev.filter(item => item.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
          setEditor({ title: '', text: '' });
        }
      } else {
        console.error("Error deleting entry:", error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    (i.original_text || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
           <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Ledger</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Database</p>
           </div>
           <Button onClick={handleCreate} disabled={isSaving} icon={Plus} className="h-10 px-4 text-[10px] uppercase tracking-widest">Add Entry</Button>
        </div>

        <div className="relative">
           <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
           <input 
              type="text" 
              placeholder="Search Entries..." 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
           />
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
           {isLoading ? (
             <div className="flex items-center justify-center p-12">
                <Loader2 size={24} className="text-indigo-500 animate-spin" />
             </div>
           ) : filteredItems.map(item => (
             <button 
               key={item.id}
               onClick={() => {
                  setSelectedId(item.id);
                  setEditor({ title: item.title, text: item.original_text || "" });
               }}
               className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start justify-between group ${selectedId === item.id ? 'bg-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/10' : 'bg-white/50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}
             >
                <div className="flex-1 min-w-0 pr-4">
                   <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate mb-1">{item.title}</p>
                   <p className="text-[10px] text-slate-400 font-medium truncate italic">{item.original_text || 'Empty description...'}</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                   <ChevronRight size={14} className={`text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all ${selectedId === item.id ? 'opacity-100' : 'opacity-0'}`} />
                </div>
             </button>
           ))}
           {!isLoading && filteredItems.length === 0 && (
             <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] italic bg-white rounded-2xl border border-dashed">No portfolio entries found</div>
           )}
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedId ? (
          <div className="space-y-6">
            <Card className="p-8" accentColor="indigo">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                        <StickyNote size={24} />
                     </div>
                     <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Entry Workspace</h3>
                        <p className="text-lg font-black text-slate-900 tracking-tight uppercase">Ledger Reference: {editor.title || 'Draft'}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <Button onClick={() => handleDelete(selectedId)} variant="danger" icon={Trash2} className="h-10 px-4 text-[10px] uppercase tracking-widest">Delete</Button>
                     <Button onClick={handleSave} disabled={isSaving} icon={Save} variant="primary" className="h-10 px-6 text-[10px] uppercase tracking-widest">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Cloud Sync'}
                     </Button>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Entry Title</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editor.title}
                      onChange={e => setEditor({...editor, title: e.target.value})}
                      placeholder="Give this entry a title..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Original Context / Strategic Text</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[400px] resize-none leading-relaxed"
                      value={editor.text}
                      onChange={e => setEditor({...editor, text: e.target.value})}
                      placeholder="Enter the original production strategy, notes, or financial reasoning..."
                    />
                  </div>
               </div>
            </Card>
            
            <div className="grid grid-cols-2 gap-6">
               <Card className="p-6 bg-slate-900 text-white" accentColor="cyan">
                  <div className="flex items-center gap-3 mb-4">
                     <Activity size={18} className="text-cyan-400" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Analysis</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase">Chars</p>
                        <p className="text-xl font-black">{editor.text.length}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase">Words</p>
                        <p className="text-xl font-black">{editor.text.split(/\s+/).filter(Boolean).length}</p>
                     </div>
                  </div>
               </Card>
               <Card className="p-6" accentColor="slate">
                  <div className="flex items-center gap-3 mb-4">
                     <Database size={18} className="text-slate-400" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cloud Status</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <p className="text-xs font-bold text-slate-700 uppercase">Data Secure</p>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Verified Table: entries</p>
               </Card>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
             <div className="w-24 h-24 bg-slate-100 rounded-[30%] flex items-center justify-center text-slate-300 transform -rotate-12 border-4 border-dashed border-slate-200">
                <FileText size={48} />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Financial Portfolio Ledger</h3>
                <p className="text-slate-500 text-sm font-medium mt-2 max-w-xs">Select a strategic entry to begin editing, or create a new one to document your next production move.</p>
             </div>
             <Button onClick={handleCreate} icon={Plus} variant="primary" className="px-10 py-4 text-[10px] uppercase tracking-[0.2em] shadow-2xl">Create New Entry</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioHubView;
