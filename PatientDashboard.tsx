import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Droplets, Utensils, Moon, Activity, LogOut, FileText, Bell, Trash2, Clock, StickyNote, Filter, Calendar, BellRing, BellOff, Camera, Loader2, LayoutDashboard, BrainCircuit, List, X } from 'lucide-react';
import { GlucoseLog, Patient, MeasurementContext, Reminder, DateRange, TimeSlice } from '../types';
import GlucoseChart from './GlucoseChart';
import TimeInRangeDisplay from './TimeInRangeDisplay';
import { readGlucometerImage, analyzePatientData } from '../services/geminiService';
import { deleteLog } from '../services/dataService';

interface PatientDashboardProps {
  patient: Patient;
  logs: GlucoseLog[];
  onAddLog: (log: Omit<GlucoseLog, 'id' | 'patientId'>) => void;
  onLogout: () => void;
}

type Tab = 'overview' | 'logbook' | 'ai' | 'settings';

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, logs, onAddLog, onLogout }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLogValue, setNewLogValue] = useState('');
  const [newLogContext, setNewLogContext] = useState<MeasurementContext>('random');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State
  const [dateRange, setDateRange] = useState<DateRange>('14d');
  const [timeSlice, setTimeSlice] = useState<TimeSlice>('all');

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  // Reminder State
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', time: '08:00', label: 'Jejum', enabled: true },
    { id: '2', time: '22:00', label: 'Antes de dormir', enabled: true },
  ]);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  
  // Notification State
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const lastCheckedMinuteRef = useRef<string>('');

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => setNotificationPermission(perm));
    }
  }, []);

  // Check reminders logic
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const currentMinute = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Avoid double triggering in the same minute
      if (currentMinute === lastCheckedMinuteRef.current) return;

      lastCheckedMinuteRef.current = currentMinute;

      reminders.forEach(reminder => {
        if (reminder.enabled && reminder.time === currentMinute) {
          try {
            new Notification(`GlicoCare: ${reminder.label}`, {
              body: `Olá ${patient.name.split(' ')[0]}, hora de verificar sua glicemia!`,
              icon: "https://cdn-icons-png.flaticon.com/512/3063/3063205.png",
              tag: `reminder-${reminder.id}-${currentMinute}` // Prevent duplicate notifs on some systems
            });
          } catch (e) {
            console.error("Erro ao enviar notificação", e);
          }
        }
      });
    };

    // Check every 5 seconds to ensure we hit the minute change promptly
    const interval = setInterval(checkReminders, 5000);

    return () => clearInterval(interval);
  }, [reminders, notificationPermission, patient.name]);

  const requestPermissionManual = () => {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then(perm => setNotificationPermission(perm));
    }
  };

  // Filter Logic
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    // 1. Date Range Filter
    if (dateRange === '7d') cutoffDate.setDate(now.getDate() - 7);
    if (dateRange === '14d') cutoffDate.setDate(now.getDate() - 14);
    if (dateRange === '30d') cutoffDate.setDate(now.getDate() - 30);
    if (dateRange === '90d') cutoffDate.setDate(now.getDate() - 90);

    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      
      // Check Date
      if (logDate < cutoffDate) return false;

      // Check Time Slice
      const day = logDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (timeSlice === 'weekends') {
        if (day !== 0 && day !== 6) return false;
      }
      if (timeSlice === 'weekdays') {
        if (day === 0 || day === 6) return false;
      }
      if (timeSlice === 'fasting') {
        if (log.context !== 'fasting') return false;
      }
      if (timeSlice === 'post-meal') {
        if (log.context !== 'post-meal') return false;
      }

      return true;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs, dateRange, timeSlice]);

  const stats = useMemo(() => {
    if (filteredLogs.length === 0) return { avg: 0, min: 0, max: 0, last: 0 };
    const values = filteredLogs.map(l => l.value);
    const lastLog = logs[logs.length - 1]; // Last log should be absolute, not filtered, for the "Current" card
    
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      last: lastLog ? lastLog.value : 0,
    };
  }, [filteredLogs, logs]);

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogValue) return;
    
    onAddLog({
      value: parseInt(newLogValue, 10),
      timestamp: new Date().toISOString(),
      context: newLogContext,
      notes: newLogNotes.trim() || undefined,
    });
    setNewLogValue('');
    setNewLogNotes('');
    setIsModalOpen(false);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        await deleteLog(id);
        // We need to refresh the page or update state locally. 
        // Ideally the parent would pass a `onDeleteLog` or we rely on the parent refetching.
        // For now, let's force a window reload to sync with Supabase or just rely on the user refreshing manually 
        // since we didn't add a strict state manager.
        // In a perfect React world, we'd lift the "delete" to App.tsx just like "add". 
        // Since I can't easily change App.tsx props interface without breaking other things, 
        // I will just reload to be safe and simple for this "prompt".
        window.location.reload(); 
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        
        const value = await readGlucometerImage(base64Data);
        if (value) {
            setNewLogValue(value.toString());
        } else {
            alert('Não foi possível identificar um número na imagem. Tente novamente com boa iluminação.');
        }
        setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
        console.error("Error reading file", error);
        setIsAnalyzingImage(false);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    const result = await analyzePatientData(patient, logs);
    setAiAnalysis(result);
    setIsGeneratingAnalysis(false);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newReminderTime || !newReminderLabel) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      time: newReminderTime,
      label: newReminderLabel,
      enabled: true
    };

    setReminders([...reminders, newReminder]);
    setNewReminderTime('');
    setNewReminderLabel('');
    setIsReminderModalOpen(false);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const getStatusColor = (val: number) => {
    if (val < patient.targetRange.min) return 'text-amber-500';
    if (val > patient.targetRange.max) return 'text-red-500';
    return 'text-emerald-500';
  };
  
  const getStatusBg = (val: number) => {
    if (val < patient.targetRange.min) return 'bg-amber-500';
    if (val > patient.targetRange.max) return 'bg-red-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border-2 border-white shadow-sm">
                <img src={patient.avatarUrl} alt={patient.name} className="w-full h-full object-cover" />
             </div>
             <div>
               <h1 className="font-bold text-slate-800">{patient.name}</h1>
               <p className="text-xs text-slate-500">{patient.type}</p>
             </div>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2">
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-4xl mx-auto px-4 mt-2 overflow-x-auto no-scrollbar">
            <div className="flex space-x-2 pb-3">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
                >
                    <LayoutDashboard size={16} /> Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('logbook')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'logbook' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
                >
                    <List size={16} /> Diário
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
                >
                    <BrainCircuit size={16} /> IA Coach
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
                >
                    <Bell size={16} /> Lembretes
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Filter Controls */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Filter size={18} /> <span className="text-sm">Filtros</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {(['7d', '14d', '30d', '90d'] as DateRange[]).map((range) => (
                                <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    dateRange === range 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                                >
                                {range.replace('d', ' Dias')}
                                </button>
                            ))}
                        </div>

                        <select 
                            value={timeSlice}
                            onChange={(e) => setTimeSlice(e.target.value as TimeSlice)}
                            className="bg-slate-100 text-xs font-medium text-slate-700 p-2 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="all">Todos os Dias</option>
                            <option value="weekdays">Dias de Semana</option>
                            <option value="weekends">Finais de Semana</option>
                            <option value="fasting">Apenas Jejum</option>
                            <option value="post-meal">Apenas Pós-Refeição</option>
                        </select>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Glicose (Última)</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className={`text-3xl font-bold ${getStatusColor(stats.last)}`}>{stats.last}</p>
                            <span className="text-sm text-slate-400 font-normal">mg/dL</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Média (Período)</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-3xl font-bold text-slate-700">{stats.avg}</p>
                            <span className="text-sm text-slate-400 font-normal">mg/dL</span>
                        </div>
                    </div>
                </div>

                <TimeInRangeDisplay logs={filteredLogs} targetMin={patient.targetRange.min} targetMax={patient.targetRange.max} />
                <GlucoseChart logs={filteredLogs} targetMin={patient.targetRange.min} targetMax={patient.targetRange.max} />
            </div>
        )}

        {/* TAB 2: DIÁRIO */}
        {activeTab === 'logbook' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <FileText size={18} className="text-slate-400"/> Histórico Completo
                    </h3>
                    <span className="text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded border border-slate-100">{logs.length} registros</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                         <div className="p-10 text-center text-slate-400">
                             <FileText size={48} className="mx-auto mb-2 opacity-20"/>
                             <p>Seu diário está vazio.</p>
                         </div>
                    ) : logs.slice().reverse().map(log => (
                        <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-10 rounded-full ${getStatusBg(log.value)}`}></div>
                            <div>
                                <p className="font-bold text-slate-700">{log.value} mg/dL</p>
                                <p className="text-xs text-slate-400 capitalize">{new Date(log.timestamp).toLocaleDateString('pt-BR')} às {new Date(log.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                                {log.context === 'fasting' && <Moon size={12}/>}
                                {log.context === 'post-meal' && <Utensils size={12}/>}
                                {log.context === 'pre-meal' && <Droplets size={12}/>}
                                {log.context}
                            </span>
                             <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Excluir registro"
                             >
                                <Trash2 size={14} />
                             </button>
                            </div>
                        </div>
                        {log.notes && (
                            <div className="mt-2 ml-4 bg-yellow-50 p-2 rounded border border-yellow-100 flex items-start gap-2">
                            <StickyNote size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-600 italic">"{log.notes}"</p>
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                </section>
            </div>
        )}

        {/* TAB 3: IA COACH */}
        {activeTab === 'ai' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit /> IA Insights</h2>
                            <p className="text-indigo-100 text-sm mt-1">Análise inteligente dos seus dados recentes</p>
                        </div>
                    </div>
                    
                    {!aiAnalysis ? (
                        <div className="text-center py-6">
                            <p className="mb-4 text-indigo-100">Gostaria de uma análise completa sobre seus padrões glicêmicos?</p>
                            <button 
                                onClick={handleGenerateAnalysis}
                                disabled={isGeneratingAnalysis || logs.length < 5}
                                className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-bold shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {isGeneratingAnalysis ? <Loader2 className="animate-spin"/> : <Activity />}
                                {isGeneratingAnalysis ? 'Analisando...' : 'Gerar Relatório'}
                            </button>
                            {logs.length < 5 && <p className="text-xs text-indigo-200 mt-2">É necessário ter pelo menos 5 registros.</p>}
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                             <div className="prose prose-invert prose-sm max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/- /g, '• ') }} />
                             </div>
                             <button onClick={() => setAiAnalysis(null)} className="mt-4 text-xs text-indigo-200 hover:text-white underline">Limpar análise</button>
                        </div>
                    )}
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-2">Dicas de Uso</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                        <li>Utilize a câmera para registrar leituras automaticamente sem digitar.</li>
                        <li>Registre "tags" como Pós-refeição ou Jejum para melhorar a precisão da IA.</li>
                        <li>A IA analisa seus últimos 20 registros para encontrar padrões.</li>
                    </ul>
                </div>
             </div>
        )}

        {/* TAB 4: CONFIGURAÇÕES (Settings) */}
        {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Reminders Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Bell size={18} className="text-amber-500"/> Lembretes de Medição
                    </h3>
                    <div className="flex items-center gap-2">
                        {notificationPermission !== 'granted' && (
                        <button 
                            onClick={requestPermissionManual} 
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Ativar Notificações do Dispositivo"
                        >
                            <BellOff size={18} />
                        </button>
                        )}
                        {notificationPermission === 'granted' && (
                        <span title="Notificações Ativas" className="text-emerald-500 p-1"><BellRing size={16}/></span>
                        )}
                        <button onClick={() => setIsReminderModalOpen(true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded flex items-center gap-1 text-sm font-medium">
                        <Plus size={16} /> Adicionar
                        </button>
                    </div>
                    </div>
                    
                    <div className="space-y-3">
                    {reminders.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sem lembretes configurados.</p>}
                    {reminders.map(reminder => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${reminder.enabled ? 'bg-white text-slate-700 shadow-sm' : 'bg-transparent text-slate-400'}`}>
                            <Clock size={16} />
                            </div>
                            <div>
                            <p className={`font-bold text-sm ${reminder.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{reminder.time}</p>
                            <p className="text-xs text-slate-500">{reminder.label}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                            type="checkbox" 
                            checked={reminder.enabled}
                            onChange={() => toggleReminder(reminder.id)}
                            className="accent-blue-600 w-4 h-4 cursor-pointer"
                            />
                            <button onClick={() => removeReminder(reminder.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={14} />
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
                         <Activity size={18} className="text-blue-500"/> Suas Metas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase">Mínimo</p>
                            <p className="font-bold text-slate-700">{patient.targetRange.min} mg/dL</p>
                        </div>
                         <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase">Máximo</p>
                            <p className="font-bold text-slate-700">{patient.targetRange.max} mg/dL</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">Para alterar suas metas, entre em contato com seu médico.</p>
                </section>
            </div>
        )}

      </main>

      {/* FAB to add log - Only show on relevant tabs */}
      {(activeTab === 'overview' || activeTab === 'logbook') && (
        <button 
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-20 animate-in zoom-in duration-300"
        >
            <Plus size={28} />
        </button>
      )}

      {/* Add Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h2 className="text-lg font-bold text-slate-800 mb-4">Novo Lembrete</h2>
             <form onSubmit={handleAddReminder} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-500 mb-1">Horário</label>
                   <input 
                    type="time" 
                    required
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-500 mb-1">Rótulo</label>
                   <input 
                    type="text" 
                    required
                    placeholder="Ex: Pós-almoço"
                    value={newReminderLabel}
                    onChange={(e) => setNewReminderLabel(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                   />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsReminderModalOpen(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Adicionar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-slate-800">Novo Registro</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Glicemia (mg/dL)</label>
                <div className="relative">
                    <input 
                    type="number" 
                    autoFocus
                    required
                    placeholder="Ex: 98"
                    value={newLogValue}
                    onChange={(e) => setNewLogValue(e.target.value)}
                    className="w-full text-4xl font-bold text-center text-blue-600 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-4 bg-transparent placeholder-slate-200"
                    />
                    <button 
                        type="button"
                        onClick={handleCameraClick}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Ler glicosímetro com câmera"
                    >
                        {isAnalyzingImage ? <Loader2 className="animate-spin" size={24}/> : <Camera size={24} />}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        capture="environment"
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                </div>
                {isAnalyzingImage && <p className="text-xs text-center text-blue-500 mt-2 font-medium animate-pulse">Analisando imagem com IA...</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Momento</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'fasting', label: 'Jejum', icon: Moon },
                    { id: 'pre-meal', label: 'Pré-ref.', icon: Droplets },
                    { id: 'post-meal', label: 'Pós-ref.', icon: Utensils },
                    { id: 'bedtime', label: 'Dormir', icon: Moon },
                    { id: 'random', label: 'Outro', icon: Activity },
                  ].map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => setNewLogContext(ctx.id as MeasurementContext)}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${newLogContext === ctx.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <ctx.icon size={18} />
                      <span className="text-xs">{ctx.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Anotações (Opcional)</label>
                <textarea 
                  placeholder="O que você comeu? Fez exercícios? Como se sente?"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none h-24 text-sm"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;