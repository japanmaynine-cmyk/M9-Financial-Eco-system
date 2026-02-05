
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Shirt, 
  Plus, 
  ChevronRight,
  LogOut,
  User,
  Bell,
  Trash2,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  CloudUpload,
  Cloud
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Dress } from './types';
import SelectionManager from './views/SelectionManager';
import Dashboard from './views/Dashboard';
import { Button, Input, Card } from './components';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeView, setActiveView] = useState<'dashboard' | 'manager'>('dashboard');
  const [selectedDressId, setSelectedDressId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dresses, setDresses] = useState<Dress[]>([]);

  useEffect(() => {
    // Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoaded(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Clear app data when session is lost
        setDresses([]);
        setSelectedDressId(null);
        setActiveView('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchDresses();
    }
  }, [session]);

  const fetchDresses = async () => {
    setIsSyncing(true);
    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching dresses:', error);
    } else if (data && data.length > 0) {
      const fetchedDresses: Dress[] = data.map(row => ({
        ...row.content,
        id: row.id
      }));
      setDresses(fetchedDresses);
    } else if (session) {
      // Create a default dress if none exist for the new user
      const defaultDress: Partial<Dress> = {
        code: 'FL-TOP-01',
        name: 'FirstLove Summer Top',
        category: 'Sleeveless Crop Top',
        fabrication: '22-01',
        isChecked: true,
        config: {
          sizes: ['FREE', 'M', 'XL'],
          colors: ['White', 'Navy'],
          fabrics: [
            { id: 1, type: 'Shell', code: 'C-POP-01', color: 'White', price: 4500, colorMode: 'Matched' },
            { id: 2, type: 'Accessories', code: 'BTN-01', color: 'Silver', price: 500, colorMode: 'Fixed' }
          ]
        },
        orders: { 'FREE': { 'White': 100, 'Navy': 50 }, 'M': { 'White': 20 }, 'XL': { 'White': 10 } },
        consumption: { 1: { 'FREE': 1.2, 'M': 1.4, 'XL': 1.6 } },
        costs: { fixedSalary: 500000, profitTargetPct: 35, marketingPct: 8, wastagePct: 3, opsPct: 5, sewingCost: 4000, accessoriesCost: 500 },
        salesPrices: { 'FREE': { retail: 28000, ws: 21000, flash: 19000 } }
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('dresses')
        .insert([{ content: defaultDress }])
        .select();
      
      if (inserted) {
        setDresses([{ ...defaultDress, id: inserted[0].id } as Dress]);
      }
    }
    setIsSyncing(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      setLoginError(error.message);
      setIsAuthenticating(false);
    } else {
      // onAuthStateChange handles session state
      setIsAuthenticating(false);
      // Reset form on success
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      }
      // Manually trigger local state clear to ensure instant UI response
      setSession(null);
      setDresses([]);
      setSelectedDressId(null);
      setActiveView('dashboard');
      setLoginForm({ email: '', password: '' });
    }
  };

  const updateDress = async (id: number, field: string | object, value?: any) => {
    let updatedDress: Dress | undefined;

    setDresses(prevDresses => {
      const next = prevDresses.map(d => {
        if (d.id !== id) return d;
        let newD;
        if (typeof field === 'object' && field !== null) {
          newD = { ...d, ...field };
        } else {
          newD = { ...d, [field as string]: value };
        }
        updatedDress = newD;
        return newD;
      });
      return next;
    });

    if (updatedDress) {
      setIsSaving(true);
      const { error } = await supabase
        .from('dresses')
        .update({ content: updatedDress })
        .eq('id', id);
      
      if (error) console.error('Sync error:', error);
      setIsSaving(false);
    }
  };

  const handleAddDress = async () => {
    setIsSyncing(true);
    const newDressBase: Partial<Dress> = {
      code: `CODE-${Date.now().toString().slice(-4)}`,
      name: 'New Product Line',
      category: 'Top',
      fabrication: 'TBD',
      isChecked: true,
      config: { sizes: ['FREE'], colors: ['White'], fabrics: [] },
      orders: {},
      consumption: {},
      costs: { fixedSalary: 0, profitTargetPct: 30, marketingPct: 5, wastagePct: 2, opsPct: 5, sewingCost: 0, accessoriesCost: 0 },
      salesPrices: {}
    };

    const { data, error } = await supabase
      .from('dresses')
      .insert([{ content: newDressBase }])
      .select();

    if (error) {
      console.error('Error creating dress:', error);
    } else if (data) {
      const created: Dress = { ...newDressBase, id: data[0].id } as Dress;
      setDresses(prev => [...prev, created]);
      setSelectedDressId(created.id);
      setActiveView('manager');
    }
    setIsSyncing(false);
  };

  const deleteDress = async (id: number) => {
    if (window.confirm("Delete production line? This cannot be undone.")) {
      setIsSyncing(true);
      const { error } = await supabase
        .from('dresses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting dress:', error);
      } else {
        setActiveView('dashboard');
        setSelectedDressId