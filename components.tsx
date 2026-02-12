
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: 'slate' | 'cyan' | 'fuchsia' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'blue';
}

export const Card: React.FC<CardProps> = ({ children, className = "", accentColor = "slate" }) => {
  const borderColors = {
    slate: "border-t-slate-500",
    cyan: "border-t-cyan-500",
    fuchsia: "border-t-fuchsia-500",
    emerald: "border-t-emerald-500",
    indigo: "border-t-indigo-500",
    rose: "border-t-rose-500",
    amber: "border-t-amber-500",
    blue: "border-t-blue-500"
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 ${borderColors[accentColor] || borderColors.slate} ${className}`}>
      {children}
    </div>
  );
};

interface ButtonProps {
  // Fix: children made optional to support buttons with only icons (icon-only buttons)
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  className?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "", 
  icon: Icon,
  disabled = false
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100";
  const variants = {
    primary: "bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white hover:opacity-90 hover:shadow-md hover:scale-[1.02]",
    secondary: "bg-white/80 text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    danger: "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100",
    ghost: "text-slate-500 hover:text-cyan-600 hover:bg-slate-50",
    icon: "p-2 hover:bg-slate-100 text-slate-500 rounded-full"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  readOnly?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, type = "text", placeholder, className = "", prefix, suffix, readOnly = false }) => (
  <div className={`flex flex-col ${className}`}>
    {label && <label className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>}
    <div className="relative flex items-center group">
      {prefix && <span className="absolute left-3 text-slate-400 text-sm">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-100' : 'group-hover:border-slate-300'}`}
      />
      {suffix && <span className="absolute right-3 text-slate-400 text-sm">{suffix}</span>}
    </div>
  </div>
);

interface KpiCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200"
  };
  const iconBg = colors[color]?.split(' ')[0].replace('50', '100') || "bg-slate-100";

  return (
    <div className={`p-5 rounded-xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-1 ${colors[color] || colors.slate}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
          <h3 className="text-2xl font-black tracking-tight">{value} <span className="text-sm font-medium opacity-60 ml-0.5">{unit}</span></h3>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} bg-opacity-50`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};
