import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { StatData } from '../types';

const data: StatData[] = [
  { name: 'Lun', sales: 4000, visitors: 2400 },
  { name: 'Mar', sales: 3000, visitors: 1398 },
  { name: 'Mer', sales: 2000, visitors: 9800 },
  { name: 'Gio', sales: 2780, visitors: 3908 },
  { name: 'Ven', sales: 1890, visitors: 4800 },
  { name: 'Sab', sales: 2390, visitors: 3800 },
  { name: 'Dom', sales: 3490, visitors: 4300 },
];

const StatCard = ({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      <p className="text-xs text-green-600 mt-1 font-medium">{trend} vs mese scorso</p>
    </div>
    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
      <Icon size={24} />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard Panoramica</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vendite Totali" value="€24,500" icon={DollarSign} trend="+12%" />
        <StatCard title="Ordini" value="1,240" icon={ShoppingBag} trend="+5%" />
        <StatCard title="Visitatori" value="14,200" icon={Users} trend="+18%" />
        <StatCard title="Conversione" value="3.2%" icon={TrendingUp} trend="+0.4%" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Andamento Settimanale</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;