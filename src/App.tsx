import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  CreditCard,
  LineChart,
  Wallet,
  Bot,
  HelpCircle,
  User,
  Settings,
  LogOut,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Send,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  Search,
  Bell,
  Utensils,
  Copy,
  Check,
  Code2,
  FileText,
  DollarSign,
  PieChart,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { INITIAL_TRANSACTIONS, INITIAL_MESSAGES } from './data';
import { TabType, Transaction, ChatMessage } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [authMode, setAuthMode] = useState<'app' | 'welcome' | 'login'>('app');
  const [accountType, setAccountType] = useState<'Individual' | 'Corporate'>('Individual');
  const [showPassword, setShowPassword] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // Form State for Add Transaction
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [customCategory, setCustomCategory] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI / Wallet');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<string | null>(null);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date(txDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: description.trim() || (txType === 'income' ? 'Income Deposit' : category === 'others' ? customCategory || 'Misc Expense' : category),
      category: category === 'others' ? customCategory || 'Others' : category,
      categoryType: (category as any) || 'Other',
      method: paymentMethod,
      amount: parsedAmount,
      type: txType,
    };

    setTransactions([newTx, ...transactions]);
    triggerToast(`Successfully recorded ₹${parsedAmount.toLocaleString('en-IN')} ${txType}!`);
    setAmount('');
    setDescription('');
    setReceiptFile(null);
    setCurrentTab('dashboard');
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputMessage('');

    // AI Response simulation based on question
    setTimeout(() => {
      let aiReply: ChatMessage;
      const lower = text.toLowerCase();

      if (lower.includes('save') || lower.includes('saving')) {
        aiReply = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: 'Here are 3 high-impact recommendations to boost your monthly savings rate from 43% to 50%:',
          bullets: [
            'Cap weekend dining out to ₹6,000/month (Estimated savings: ₹4,500)',
            'Consolidate 3 recurring subscriptions into annual plans (Estimated savings: ₹1,200/mo)',
            'Auto-route 20% of your salary into a high-yield index SIP on payday',
          ],
          note: 'Would you like me to set a monthly ₹8,000 entertainment spending limit alert?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else if (lower.includes('budget') || lower.includes('breakdown')) {
        aiReply = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Your current monthly spending breakdown totals ₹${totalExpense.toLocaleString('en-IN')}:`,
          bullets: [
            'Fixed Living & Rent: ~30% (₹12,750)',
            'Dining & Groceries: ~15% (₹6,375)',
            'Discretionary & Entertainment: ~27% (₹11,475)',
            'Utilities & Misc: ~28% (₹11,900)',
          ],
          note: 'Your discretionary spending is slightly high. I recommend the 50-30-20 budget framework.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        aiReply = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Analysis complete for "${text}". Based on your recent transactions, your net balance stands at ₹${balance.toLocaleString('en-IN')}.`,
          bullets: [
            `Total Monthly Income: ₹${totalIncome.toLocaleString('en-IN')}`,
            `Current Expenses: ₹${totalExpense.toLocaleString('en-IN')}`,
            `Savings Efficiency: ${savingsRate}%`,
          ],
          note: 'Ask me anything about category budgeting, recurring subscriptions, or tax-saving strategies.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      setMessages([...newMessages, aiReply]);
    }, 600);
  };

  const copyPromptText = () => {
    navigator.clipboard.writeText(MASTER_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  // Welcome / Login Screen
  if (authMode !== 'app') {
    return (
      <div className="bg-[#020617] text-slate-200 font-sans h-screen w-full flex overflow-hidden relative">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-[25%] right-[20%] w-[35%] h-[35%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Left Hero Section */}
        <div className="hidden lg:flex w-1/2 bg-white/5 backdrop-blur-2xl relative flex-col justify-between p-12 overflow-hidden border-r border-white/10 z-10">
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-lg shadow-indigo-500/30 border border-white/20">
                <span className="text-emerald-200">F</span>T
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                FINTRACK
              </span>
            </div>
            
            <span className="inline-block px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold mb-4 tracking-wider">
              FINANCIAL INTELLIGENCE v4.0
            </span>

            <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight max-w-md">
              Track. Analyze. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400">
                Grow with clarity.
              </span>
            </h1>
            <p className="text-base text-slate-400 mt-5 max-w-md leading-relaxed">
              The institutional-grade platform with frosted glass clarity for managing your financial trajectory with absolute precision.
            </p>
          </div>

          {/* Visual Presentation Card */}
          <div className="relative z-10 mt-auto rounded-3xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Live Portfolio Analysis</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +24.8% YTD
              </span>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase">TRACKED</div>
                <div className="text-xl font-bold text-white mt-0.5">₹12.4M+</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase">EFFICIENCY</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">99.4%</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase">INSIGHTS</div>
                <div className="text-xl font-bold text-indigo-300 mt-0.5">Real-time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Interaction Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
          <div className="w-full max-w-md">
            {authMode === 'welcome' ? (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to FINTRACK</h2>
                  <p className="text-slate-400 text-sm">Select your account profile type to proceed.</p>
                </div>

                {/* Individual Card */}
                <button
                  onClick={() => {
                    setAccountType('Individual');
                    setAuthMode('login');
                  }}
                  className="group flex items-start gap-4 p-6 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-emerald-400/50 shadow-2xl transition-all text-left w-full cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-lg shadow-emerald-500/10">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">Individual</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Manage personal finances, track investments, and plan your wealth growth.</p>
                  </div>
                </button>

                {/* Corporate Card */}
                <button
                  onClick={() => {
                    setAccountType('Corporate');
                    setAuthMode('login');
                  }}
                  className="group flex items-start gap-4 p-6 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-indigo-400/50 shadow-2xl transition-all text-left w-full cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-lg shadow-indigo-500/10">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">Corporate</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Manage organization expenses, payroll, and enterprise financial analytics.</p>
                  </div>
                </button>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => setAuthMode('app')}
                    className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Skip directly to Live Dashboard Preview →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-fadeIn bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                <button
                  onClick={() => setAuthMode('welcome')}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-mono transition-colors self-start cursor-pointer"
                >
                  ← Back to selection
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Login to {accountType}</h2>
                  <p className="text-xs text-slate-400">Enter your credentials to access your financial dashboard.</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAuthMode('app');
                    triggerToast(`Welcome back to FINTRACK ${accountType}!`);
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Username / Email</label>
                    <input
                      type="text"
                      defaultValue="alex.morgan@fintrack.io"
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none backdrop-blur-md text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        defaultValue="fintrack2026"
                        required
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none backdrop-blur-md text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-emerald-500" />
                      Remember Me
                    </label>
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-emerald-400 hover:underline">
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 via-emerald-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl py-3 px-4 font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer mt-2 border border-white/10"
                  >
                    Access Dashboard
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Primary FINTRACK Application with Frosted Glass Theme
  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden relative">
      {/* Ambient Glowing Orbs for Frosted Glass Backdrop */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#020617]/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Prompt Modal / Prompt Builder */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#020617]/90 backdrop-blur-2xl rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/15 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Website Generation Prompt</h3>
                  <p className="text-xs font-mono text-slate-400">Copy-ready prompt engineered for AI code generation</p>
                </div>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-black/40 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 border-y border-white/5">
              {MASTER_PROMPT}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Includes Frosted Glass Tokens, Layouts, State Model & Charts
              </span>
              <button
                onClick={copyPromptText}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer shadow-lg shadow-emerald-600/20 border border-white/10"
              >
                {promptCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {promptCopied ? 'COPIED TO CLIPBOARD!' : 'COPY FULL PROMPT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col h-full w-64 bg-white/5 backdrop-blur-2xl border-r border-white/10 py-5 z-20 shrink-0 shadow-2xl">
        {/* Brand */}
        <div className="px-6 pb-6 mb-2 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 border border-white/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 tracking-tight">
              FINTRACK
            </h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Track. Analyze. Grow.</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-1.5">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-white font-bold border-l-4 border-emerald-400 bg-white/10 backdrop-blur-md shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('add-transaction')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left cursor-pointer ${
              currentTab === 'add-transaction'
                ? 'text-white font-bold border-l-4 border-emerald-400 bg-white/10 backdrop-blur-md shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            onClick={() => setCurrentTab('expenses')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left cursor-pointer ${
              currentTab === 'expenses'
                ? 'text-white font-bold border-l-4 border-emerald-400 bg-white/10 backdrop-blur-md shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Expenses</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left cursor-pointer ${
              currentTab === 'analytics'
                ? 'text-white font-bold border-l-4 border-emerald-400 bg-white/10 backdrop-blur-md shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setCurrentTab('budget')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left cursor-pointer ${
              currentTab === 'budget'
                ? 'text-white font-bold border-l-4 border-emerald-400 bg-white/10 backdrop-blur-md shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Budget</span>
          </button>

          <button
            onClick={() => setCurrentTab('ai-advisor')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left cursor-pointer ${
              currentTab === 'ai-advisor'
                ? 'text-white font-bold border-l-4 border-emerald-400 bg-white/10 backdrop-blur-md shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Advisor</span>
          </button>

          <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-1">
            <button
              onClick={() => triggerToast('Support desk is available 24/7 at support@fintrack.io')}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 text-left cursor-pointer transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Support</span>
            </button>
            <button
              onClick={() => setAuthMode('welcome')}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 text-left cursor-pointer transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile ({accountType})</span>
            </button>
            <button
              onClick={() => triggerToast('FINTRACK Settings synchronized.')}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 text-left cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => setAuthMode('welcome')}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-500/10 text-left cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="px-4 pt-3">
          <button
            onClick={() => triggerToast('Pro Plan: Unlimited automated bank sync, multi-currency & tax optimization enabled!')}
            className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 py-2.5 px-3 rounded-2xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 text-white font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Upgrade Pro
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10 relative">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#020617]/70 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
              {currentTab === 'dashboard' && 'Good Morning, Alex 👋'}
              {currentTab === 'add-transaction' && 'Record Activity'}
              {currentTab === 'ai-advisor' && 'FINTRACK AI Advisor'}
              {currentTab === 'expenses' && 'Expense Ledger'}
              {currentTab === 'analytics' && 'Financial Analytics & Trends'}
              {currentTab === 'budget' && 'Budget Planner'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Prompt View / Export Button */}
            <button
              onClick={() => setShowPromptModal(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-semibold px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Creation Prompt</span>
            </button>

            <button
              onClick={() => triggerToast('No unread notifications')}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 relative transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-sm shadow-rose-500" />
            </button>

            <div
              onClick={() => setAuthMode('welcome')}
              className="h-9 w-9 rounded-xl border border-white/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
            >
              <img
                alt="Alex Avatar"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              />
            </div>
          </div>
        </header>

        {/* Tab View Routing */}
        <main className="p-6 lg:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-6">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <>
              {/* Summary 4-Card Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Income */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl hover:border-white/20 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" /> +12.5%
                    </span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Total Income</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight">₹{totalIncome.toLocaleString('en-IN')}</h3>
                </div>

                {/* Total Expenses */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl hover:border-white/20 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-xs font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" /> +4.2%
                    </span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Total Expenses</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight">₹{totalExpense.toLocaleString('en-IN')}</h3>
                </div>

                {/* Balance */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl hover:border-white/20 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/10">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 font-mono text-xs">
                      → 0.0%
                    </span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Balance</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight">₹{balance.toLocaleString('en-IN')}</h3>
                </div>

                {/* Savings Rate */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl hover:border-white/20 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/10">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono text-xs font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" /> +2.1%
                    </span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Savings Rate</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{savingsRate}%</h3>
                </div>
              </div>

              {/* Bento Grid Charts & Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart: Expense Breakdown */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col">
                  <h4 className="text-lg font-bold text-white mb-4 pb-3 border-b border-white/10">
                    Expense Breakdown
                  </h4>

                  <div className="flex-1 flex flex-col items-center justify-center my-4 relative">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      {/* SVG Donut */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Background circle */}
                        <path
                          className="text-white/10"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Rent segment (30%) */}
                        <path
                          className="text-emerald-400"
                          strokeDasharray="30, 100"
                          strokeWidth="4.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Food segment (15%) */}
                        <path
                          className="text-indigo-400"
                          strokeDashoffset="-30"
                          strokeDasharray="15, 100"
                          strokeWidth="4.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Others segment (55%) */}
                        <path
                          className="text-purple-400"
                          strokeDashoffset="-45"
                          strokeDasharray="55, 100"
                          strokeWidth="4.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>

                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold text-white">
                          ₹{(totalExpense / 1000).toFixed(1)}k
                        </span>
                        <span className="text-[10px] font-mono uppercase text-slate-400">Total</span>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2 mt-auto pt-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                        <span className="text-slate-300">Rent</span>
                      </div>
                      <span className="font-bold text-white">30%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                        <span className="text-slate-300">Food</span>
                      </div>
                      <span className="font-bold text-white">15%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                        <span className="text-slate-300">Others</span>
                      </div>
                      <span className="font-bold text-white">55%</span>
                    </div>
                  </div>
                </div>

                {/* Right 2 Columns: Bar Chart + Recent Transactions */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* Monthly Spending Bar Chart */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                      <h4 className="text-lg font-bold text-white">Monthly Spending</h4>
                      <span className="text-xs font-mono text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Average ₹38,200/mo
                      </span>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-3 px-2">
                      {[
                        { month: 'Jan', height: '40%', color: 'bg-emerald-400/80', val: '₹34,000' },
                        { month: 'Feb', height: '60%', color: 'bg-indigo-400/80', val: '₹41,200' },
                        { month: 'Mar', height: '35%', color: 'bg-emerald-400/80', val: '₹31,500' },
                        { month: 'Apr', height: '80%', color: 'bg-teal-400/90', val: '₹42,500' },
                        { month: 'May', height: '50%', color: 'bg-emerald-400/80', val: '₹37,800' },
                        { month: 'Jun', height: '45%', color: 'bg-indigo-400/80', val: '₹35,000' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="relative w-full flex items-end justify-center">
                            <div
                              style={{ height: item.height }}
                              className={`w-full max-w-[48px] rounded-t-xl ${item.color} group-hover:brightness-125 transition-all cursor-pointer backdrop-blur-md shadow-lg`}
                            />
                            {/* Hover Tooltip */}
                            <div className="absolute -top-8 bg-[#020617] text-white px-2.5 py-1 rounded-lg text-[10px] font-mono border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                              {item.val}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-400">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions Table */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-5 pb-3 border-b border-white/10 flex justify-between items-center">
                      <h4 className="text-lg font-bold text-white">Recent Transactions</h4>
                      <button
                        onClick={() => setCurrentTab('expenses')}
                        className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        View All ({transactions.length}) →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-white/5 text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-white/10">
                          <tr>
                            <th className="p-3.5 font-medium">Date</th>
                            <th className="p-3.5 font-medium">Description</th>
                            <th className="p-3.5 font-medium">Category</th>
                            <th className="p-3.5 font-medium">Method</th>
                            <th className="p-3.5 font-medium text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {transactions.slice(0, 5).map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 text-slate-400 font-mono text-xs">{tx.date}</td>
                              <td className="p-3.5 font-medium text-white">{tx.description}</td>
                              <td className="p-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                                    tx.type === 'income'
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : tx.category === 'Entertainment'
                                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                  }`}
                                >
                                  {tx.category}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-400 text-xs font-mono">{tx.method}</td>
                              <td
                                className={`p-3.5 text-right font-mono font-bold ${
                                  tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                                }`}
                              >
                                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ADD TRANSACTION (RECORD ACTIVITY) */}
          {currentTab === 'add-transaction' && (
            <div className="max-w-[800px] mx-auto w-full">
              <form
                onSubmit={handleAddTransaction}
                className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="p-6 md:p-8 space-y-6">
                  {/* Toggle: Expense / Income */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Transaction Type</label>
                    <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl w-full max-w-sm">
                      <button
                        type="button"
                        onClick={() => setTxType('expense')}
                        className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer font-bold ${
                          txType === 'expense'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxType('income')}
                        className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer font-bold ${
                          txType === 'income'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-2xl font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`block w-full pl-12 pr-4 py-3 text-3xl font-bold bg-white/5 border border-white/15 rounded-2xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none backdrop-blur-md ${
                          txType === 'income' ? 'text-emerald-400' : 'text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Category & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0f172a] border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-400 outline-none"
                      >
                        <option value="Groceries">Food & Dining</option>
                        <option value="Transport">Transportation</option>
                        <option value="Utilities">Utilities & Bills</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Salary">Salary & Income</option>
                        <option value="others">Others / Custom...</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Date</label>
                      <input
                        type="date"
                        required
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0f172a] border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-400 outline-none"
                      />
                    </div>

                    {category === 'others' && (
                      <div className="flex flex-col gap-2 md:col-span-2 animate-fadeIn">
                        <label className="text-xs font-mono uppercase tracking-widest text-emerald-400">Custom Category Name</label>
                        <input
                          type="text"
                          required
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g., Freelance Project X"
                          className="w-full px-4 py-2.5 bg-white/5 border border-emerald-400/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0f172a] border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-400 outline-none"
                      >
                        <option value="UPI / Wallet">UPI / Wallet (GPay, PhonePe, Paytm)</option>
                        <option value="Credit Card">Credit / Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add notes about this transaction..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400 outline-none resize-none backdrop-blur-md"
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-400">Receipt / Invoice</label>
                    <div
                      onClick={() => {
                        setReceiptFile('receipt_invoice_sample.pdf');
                        triggerToast('Sample receipt attached!');
                      }}
                      className="border-2 border-dashed border-white/20 hover:border-emerald-400/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-white/5 backdrop-blur-md cursor-pointer transition-all"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-300">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-200">
                          {receiptFile ? (
                            <span className="text-emerald-400 font-bold font-mono">✓ {receiptFile} Attached</span>
                          ) : (
                            <>
                              <span className="font-bold text-white">Click to upload</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white/5 px-8 py-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('dashboard')}
                    className="px-5 py-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-mono uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                  >
                    <PlusCircle className="w-4 h-4" /> Save Transaction
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: AI ADVISOR */}
          {currentTab === 'ai-advisor' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  FINTRACK AI - Your Intelligent Financial Companion
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Leverage neural insights to uncover hidden patterns in your spending and optimize your wealth building trajectory.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left: Chat Interface (8 cols) */}
                <div className="col-span-12 lg:col-span-8 flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden min-h-[580px]">
                  {/* Chat Header */}
                  <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-white/20">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white">FINTRACK Advisor</h4>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" /> Online
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 bg-transparent">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          msg.sender === 'user' ? 'self-end flex-row-reverse' : ''
                        }`}
                      >
                        {msg.sender === 'ai' ? (
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 shrink-0 flex items-center justify-center text-emerald-400 mt-1 shadow-md">
                            <Bot className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shrink-0 overflow-hidden mt-1 shadow-md">
                            <img
                              alt="User"
                              className="w-full h-full object-cover"
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            />
                          </div>
                        )}

                        <div
                          className={`p-4 rounded-2xl text-sm ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm shadow-lg shadow-indigo-600/20 border border-indigo-400/20'
                              : 'bg-white/10 backdrop-blur-md text-slate-100 rounded-tl-sm shadow-xl border border-white/15'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                          {msg.bullets && (
                            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-xs text-slate-300">
                              {msg.bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          )}
                          {msg.note && (
                            <p className="mt-2.5 text-xs text-emerald-300 font-medium pt-2.5 border-t border-white/10">
                              {msg.note}
                            </p>
                          )}
                          <span className="block text-[10px] font-mono text-slate-400 mt-2 text-right">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap gap-2 mt-auto pt-4">
                      <button
                        onClick={() => handleSendMessage('How can I save more?')}
                        className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        How can I save more?
                      </button>
                      <button
                        onClick={() => handleSendMessage('Show me my budget breakdown')}
                        className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
                      >
                        <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                        Show me my budget breakdown
                      </button>
                    </div>
                  </div>

                  {/* Input Box */}
                  <div className="p-4 border-t border-white/10 bg-white/5">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="relative flex items-center"
                    >
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask anything about your finances..."
                        className="w-full bg-white/5 border border-white/15 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none backdrop-blur-md"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right: Insights & Actions (4 cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  {/* Alert 1 */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl shadow-md">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        ALERT
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">Entertainment +27%</h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Your entertainment spending has increased significantly this month compared to last.
                    </p>
                    <button
                      onClick={() => setCurrentTab('expenses')}
                      className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Review Transactions <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Insight 2 */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shadow-md">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                        INSIGHT
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">Food Expenses High</h4>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Your food expenses are 18% higher than average, mostly driven by dining out on weekends.
                    </p>
                    <button
                      onClick={() => handleSendMessage('Why did my food expenses increase?')}
                      className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Spending Analysis <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actionable Tools Menu */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex-1">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-white/10">
                      Actionable Tools
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setCurrentTab('analytics')}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <LineChart className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-medium text-slate-200 group-hover:text-white">Spending Analysis</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <button
                        onClick={() => handleSendMessage('Give me customized savings suggestions')}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          <span className="text-sm font-medium text-slate-200 group-hover:text-white">Savings Suggestions</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <button
                        onClick={() => setCurrentTab('budget')}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className="w-5 h-5 text-teal-400" />
                          <span className="text-sm font-medium text-slate-200 group-hover:text-white">Budget Suggestions</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSES LEDGER */}
          {currentTab === 'expenses' && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2">
                <div>
                  <h3 className="text-xl font-bold text-white">Expense & Transaction History</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive log of all individual payments and income streams.</p>
                </div>
                <button
                  onClick={() => setCurrentTab('add-transaction')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 border border-white/10"
                >
                  <PlusCircle className="w-4 h-4" /> Add Transaction
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-white/5 text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 text-xs font-mono text-slate-400">{t.date}</td>
                        <td className="p-3.5 font-medium text-white">{t.description}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 border border-white/15 text-slate-200">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs font-mono text-slate-400">{t.method}</td>
                        <td className="p-3.5 text-xs font-mono">
                          <span className={t.type === 'income' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td
                          className={`p-3.5 text-right font-mono font-bold ${
                            t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {currentTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">Portfolio Trajectory & Growth Velocity</h3>
                <p className="text-xs text-slate-400 mb-6">Calculated across trailing 6-month historical cash flows.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <span className="text-xs font-mono uppercase text-slate-400">Net Inflow Growth</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">+18.4%</div>
                    <span className="text-xs text-slate-400 mt-1 block">Outperforming benchmark targets</span>
                  </div>
                  <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <span className="text-xs font-mono uppercase text-slate-400">Discretionary Ratio</span>
                    <div className="text-2xl font-bold text-rose-400 mt-1">27.0%</div>
                    <span className="text-xs text-slate-400 mt-1 block">Threshold: max 20% suggested</span>
                  </div>
                  <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <span className="text-xs font-mono uppercase text-slate-400">Projected Annual Net</span>
                    <div className="text-2xl font-bold text-indigo-300 mt-1">₹3,90,000</div>
                    <span className="text-xs text-slate-400 mt-1 block">Based on current 43% savings rate</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BUDGET */}
          {currentTab === 'budget' && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Monthly Category Budgets</h3>
                <p className="text-xs text-slate-400 mt-0.5">Set expenditure limits and track real-time utilization.</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Rent & Housing', spent: 12750, limit: 15000, color: 'bg-gradient-to-r from-emerald-500 to-teal-400' },
                  { name: 'Food & Dining', spent: 6375, limit: 8000, color: 'bg-gradient-to-r from-indigo-500 to-cyan-400' },
                  { name: 'Entertainment & Leisure', spent: 11475, limit: 9000, color: 'bg-gradient-to-r from-rose-500 to-amber-500' },
                  { name: 'Utilities & Bills', spent: 11900, limit: 14000, color: 'bg-gradient-to-r from-purple-500 to-indigo-400' },
                ].map((b, idx) => {
                  const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
                  return (
                    <div key={idx} className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-white">{b.name}</span>
                        <span className="font-mono text-xs text-slate-300">
                          ₹{b.spent.toLocaleString('en-IN')} / ₹{b.limit.toLocaleString('en-IN')} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className={`h-full ${b.color} transition-all rounded-full shadow-md`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Master prompt string ready for copying
const MASTER_PROMPT = `
# FINTRACK: Intelligent Financial Companion & Management Platform (Frosted Glass Edition)

Create a high-performance, institutional-grade financial SaaS web application named "FINTRACK" with the slogan "Track. Analyze. Grow." built with React, TypeScript, and Tailwind CSS using the Frosted Glass theme.

---

## 1. Visual Identity & Design System Tokens

### Palette & Colors:
- **Base Canvas:** Deep Dark Canvas (\`#020617\`)
- **Glowing Ambient Accents:** Indigo Blur (\`indigo-600/30\`), Emerald Glow (\`emerald-500/20\`), Purple Hue (\`purple-600/20\`)
- **Frosted Containers:** \`bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl\`
- **Interactive Badges:** \`bg-white/10 backdrop-blur-md border border-white/20\`
- **Text:**
  - Headings: \`text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70\` or crisp white (\`text-white\`)
  - Subheadings & Labels: \`text-slate-400\`
- **Status Accents:**
  - Positive/Income: \`emerald-400\` (\`bg-emerald-500/15 border-emerald-500/30\`)
  - Alert/Expense: \`rose-400\` (\`bg-rose-500/15 border-rose-500/30\`)

### Typography:
- **Headings & Body:** \`Inter\`
- **Financial Labels, Codes & Numbers:** \`JetBrains Mono\`
`;
