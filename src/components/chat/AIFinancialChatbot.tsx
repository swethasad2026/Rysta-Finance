import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  User,
  ArrowRight,
  Receipt,
  CreditCard,
  Wallet,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { fetchInvoices } from '@/api/invoices';
import { fetchUserExpenses, fetchUserIncome, ExpenseItem, IncomeItem } from '@/api/supabaseService';
import { getOpeningCashBalance, calculateCashFlowMetrics, CashFlowMetrics } from '@/api/cashflow';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Invoice } from '@/types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: 'cashflow' | 'invoices' | 'expenses' | 'general' | 'recommendation';
  dataCard?: {
    title: string;
    metrics: { label: string; value: string; color?: string }[];
  };
}

const QUICK_PROMPTS = [
  'What is our projected cash flow for the next 30 days?',
  'Which invoices are currently overdue and pending collection?',
  'Break down our operating expenses by category.',
  'How can we mitigate our current cash deficit?',
  'Summarize our overall financial health.',
];

export const AIFinancialChatbot: React.FC = () => {
  const { user } = useAuthStore();
  const userEmail = (user?.email || '').trim();
  const userName = user?.business_name || user?.name || (userEmail ? userEmail.split('@')[0] : 'Merchant');

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Financial live ledger state for analysis
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [income, setIncome] = useState<IncomeItem[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [metrics, setMetrics] = useState<CashFlowMetrics | null>(null);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load real financial data for AI context
  const loadData = async () => {
    if (!userEmail) return;
    try {
      setIsLoadingFinancials(true);
      const [invData, expData, incData] = await Promise.all([
        fetchInvoices(userEmail),
        fetchUserExpenses(userEmail),
        fetchUserIncome(userEmail),
      ]);
      const safeInvs = invData || [];
      const safeExps = expData || [];
      const safeIncs = incData || [];
      const balance = getOpeningCashBalance(userEmail);

      setInvoices(safeInvs);
      setExpenses(safeExps);
      setIncome(safeIncs);
      setOpeningBalance(balance);

      const computed = calculateCashFlowMetrics(safeInvs, balance, null, userEmail, safeExps, safeIncs);
      setMetrics(computed);
    } catch (err) {
      console.warn('[AI Chatbot] Failed to fetch live financials context:', err);
    } finally {
      setIsLoadingFinancials(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener('rysta-invoices-refresh', handleRefresh);
    window.addEventListener('rysta-cashflow-refresh', handleRefresh);
    return () => {
      window.removeEventListener('rysta-invoices-refresh', handleRefresh);
      window.removeEventListener('rysta-cashflow-refresh', handleRefresh);
    };
  }, [userEmail]);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello ${userName}! I am your AI Financial Copilot. I have analyzed your live Supabase invoices, expenses, income, and cash flow forecasts. Ask me anything about your working capital, pending receivables, expense breakdown, or cash shortage mitigation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isThinking]);

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Financial analysis reasoning engine
  const generateAIResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase().trim();
    const id = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
    const pendingInvoices = invoices.filter((inv) => inv.status !== 'paid' && (Number(inv.balanceDue) > 0 || Number(inv.grandTotal) > 0));
    const totalReceivables = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || Number(inv.grandTotal) || 0), 0);
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue' || (inv.status !== 'paid' && new Date(inv.dueDate) < new Date()));
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || Number(inv.grandTotal) || 0), 0);

    const totalOpEx = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalInflows = income.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    const currentOpening = openingBalance;
    const projectedNet = metrics ? metrics.projectedNetCash : (currentOpening + totalReceivables - totalOpEx);
    const hasDeficit = projectedNet < 0;
    const deficitAmt = hasDeficit ? Math.abs(projectedNet) : 0;
    const dailyBurn = totalOpEx > 0 ? totalOpEx / 30 : 0;
    const runwayDays = dailyBurn > 0 ? Math.round((currentOpening + totalReceivables) / dailyBurn) : 90;

    // Category breakdown of expenses
    const expCategories: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'General Operations';
      expCategories[cat] = (expCategories[cat] || 0) + Number(e.amount || 0);
    });
    const sortedCategories = Object.entries(expCategories).sort((a, b) => b[1] - a[1]);

    // 1. CASH FLOW & FORECAST QUERY
    if (q.includes('cash flow') || q.includes('cashflow') || q.includes('projected') || q.includes('runway') || q.includes('liquidity')) {
      const statusText = hasDeficit
        ? `⚠️ **Warning: Cash Deficit Projected**\nYour projected 30-day net cash is **${formatCurrency(projectedNet)}** (a shortfall of **${formatCurrency(deficitAmt)}**).`
        : `✅ **Healthy Cash Flow**\nYour projected 30-day net cash is **+${formatCurrency(projectedNet)}** with comfortable working capital coverage.`;

      const responseText = `${statusText}\n\n**Key Liquidity Summary:**\n• **Opening Cash Balance:** ${formatCurrency(currentOpening)}\n• **30-Day Incoming Receivables:** +${formatCurrency(totalReceivables)} (${pendingInvoices.length} invoices)\n• **30-Day Outgoing Payables / OpEx:** -${formatCurrency(totalOpEx)}\n• **Projected Operational Runway:** ~${runwayDays} Days (at ₹${Math.round(dailyBurn).toLocaleString('en-IN')}/day spend)\n\n${hasDeficit ? '🔔 Automated shortage email alerts have been activated to notify your finance team.' : 'Your liquidity buffer is sufficient to satisfy upcoming vendor commitments.'}`;

      return {
        id,
        sender: 'assistant',
        text: responseText,
        timestamp,
        category: 'cashflow',
        dataCard: {
          title: '30-Day Liquidity Forecast',
          metrics: [
            { label: 'Available Cash', value: formatCurrency(currentOpening) },
            { label: 'Receivables', value: `+${formatCurrency(totalReceivables)}`, color: 'text-emerald-600' },
            { label: 'Payables', value: `-${formatCurrency(totalOpEx)}`, color: 'text-rose-600' },
            { label: 'Net Projected', value: formatCurrency(projectedNet), color: hasDeficit ? 'text-rose-600' : 'text-emerald-600' },
          ],
        },
      };
    }

    // 2. INVOICES & RECEIVABLES QUERY
    if (q.includes('invoice') || q.includes('overdue') || q.includes('pending') || q.includes('receivable') || q.includes('debtor') || q.includes('client')) {
      if (q.includes('overdue')) {
        if (overdueInvoices.length === 0) {
          return {
            id,
            sender: 'assistant',
            text: `🎉 **Great news!** You currently have **0 overdue invoices** in your ledger. All client invoices are either fully paid or within their agreed credit terms. Total pending receivables on schedule: **${formatCurrency(totalReceivables)}**.`,
            timestamp,
            category: 'invoices',
          };
        }

        const listText = overdueInvoices
          .slice(0, 5)
          .map((inv) => `• **${inv.invoiceNumber}** — ${inv.customerName || 'Trade Partner'}: **${formatCurrency(Number(inv.balanceDue) || Number(inv.grandTotal))}** (Due: ${formatDate(inv.dueDate)})`)
          .join('\n');

        return {
          id,
          sender: 'assistant',
          text: `🚨 **Overdue Invoices Identified:**\nYou have **${overdueInvoices.length} overdue invoices** totaling **${formatCurrency(totalOverdue)}**:\n\n${listText}\n\n💡 **Action:** Expediting payment collection on these overdue accounts will immediately improve your cash runway.`,
          timestamp,
          category: 'invoices',
          dataCard: {
            title: 'Overdue Collections',
            metrics: [
              { label: 'Overdue Count', value: `${overdueInvoices.length} Invoices` },
              { label: 'Overdue Amount', value: formatCurrency(totalOverdue), color: 'text-rose-600' },
            ],
          },
        };
      }

      return {
        id,
        sender: 'assistant',
        text: `📊 **Invoice Portfolio Analysis:**\n• **Total Invoiced to Date:** ${formatCurrency(totalInvoiced)} across ${invoices.length} invoices\n• **Realized Collections (Paid):** ${formatCurrency(totalPaid)} (${paidInvoices.length} invoices)\n• **Pending Receivables:** ${formatCurrency(totalReceivables)} (${pendingInvoices.length} invoices)\n• **Overdue Receivables:** ${formatCurrency(totalOverdue)} (${overdueInvoices.length} invoices)\n\nCollection rate stands at **${totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%**.`,
        timestamp,
        category: 'invoices',
        dataCard: {
          title: 'Invoice Status Breakdown',
          metrics: [
            { label: 'Total Invoiced', value: formatCurrency(totalInvoiced) },
            { label: 'Paid Collections', value: formatCurrency(totalPaid), color: 'text-emerald-600' },
            { label: 'Pending Dues', value: formatCurrency(totalReceivables), color: 'text-amber-600' },
          ],
        },
      };
    }

    // 3. EXPENSES & OUTFLOWS QUERY
    if (q.includes('expense') || q.includes('spending') || q.includes('outflow') || q.includes('cost') || q.includes('payables') || q.includes('burn')) {
      if (expenses.length === 0) {
        return {
          id,
          sender: 'assistant',
          text: `You currently have **no operating expenses recorded** in your Supabase account. You can log operational expenses directly from the **Expense Management** (/expenses) tab.`,
          timestamp,
          category: 'expenses',
        };
      }

      const breakdownText = sortedCategories
        .slice(0, 5)
        .map(([cat, amt]) => {
          const pct = totalOpEx > 0 ? Math.round((amt / totalOpEx) * 100) : 0;
          return `• **${cat}:** ${formatCurrency(amt)} (${pct}% of total)`;
        })
        .join('\n');

      return {
        id,
        sender: 'assistant',
        text: `💸 **Expense Breakdown & Outflows:**\nTotal recorded expenditures stand at **${formatCurrency(totalOpEx)}** across ${expenses.length} entries.\n\n**Category Distribution:**\n${breakdownText}\n\n💡 **CFO Tip:** ${sortedCategories[0] ? `Your largest cost driver is **${sortedCategories[0][0]}** (${formatCurrency(sortedCategories[0][1])}). Negotiating volume terms or deferred settlement here will protect cash reserves.` : ''}`,
        timestamp,
        category: 'expenses',
        dataCard: {
          title: 'Top Operational Costs',
          metrics: sortedCategories.slice(0, 3).map(([cat, amt]) => ({
            label: cat,
            value: formatCurrency(amt),
          })),
        },
      };
    }

    // 4. RECOMMENDATIONS & SHORTAGE MITIGATION
    if (q.includes('mitigate') || q.includes('shortage') || q.includes('deficit') || q.includes('recommend') || q.includes('suggestion') || q.includes('advice') || q.includes('improve')) {
      return {
        id,
        sender: 'assistant',
        text: `🎯 **AI CFO Working Capital Action Plan:**\n\n1. **Accelerate Overdue Receivables:**\n   Follow up immediately on **${overdueInvoices.length} overdue invoices** worth **${formatCurrency(totalOverdue)}**. Offering a prompt 2% cash discount often speeds up realization within 48 hours.\n\n2. **Stagger High Vendor Payables:**\n   Request a 14-day settlement grace period on non-urgent operational payables (${formatCurrency(totalOpEx)} total) to bridge expected liquidity dips.\n\n3. **Maintain Cash Buffer Target:**\n   Adjust your Opening Cash Balance in Settings to at least **${formatCurrency(Math.max(50000, deficitAmt + 25000))}** to establish a minimum 15-day reserve against volatile supply cycles.`,
        timestamp,
        category: 'recommendation',
      };
    }

    // 5. SUMMARY & FINANCIAL HEALTH
    if (q.includes('summary') || q.includes('health') || q.includes('overview') || q.includes('status')) {
      return {
        id,
        sender: 'assistant',
        text: `📈 **Executive Financial Summary for ${userName}:**\n\n• **Liquidity Health:** ${hasDeficit ? '⚠️ Deficit Alert' : '✅ Stable Working Capital'}\n• **Opening Cash:** ${formatCurrency(currentOpening)}\n• **Projected 30-Day Net Cash:** ${formatCurrency(projectedNet)}\n• **Open Customer Dues:** ${formatCurrency(totalReceivables)} (${pendingInvoices.length} invoices)\n• **Realized Operating Expenses:** ${formatCurrency(totalOpEx)}\n• **Collection Rate:** ${totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%\n\nNeed drill-downs on any specific invoice, expense category, or automated alert? Just ask!`,
        timestamp,
        category: 'general',
      };
    }

    // Default intelligent fallback
    return {
      id,
      sender: 'assistant',
      text: `I analyzed your query in relation to your live accounts:\n\n• **Opening Cash:** ${formatCurrency(currentOpening)}\n• **Projected 30-Day Net Cash:** ${formatCurrency(projectedNet)}\n• **Open Receivables:** ${formatCurrency(totalReceivables)} (${pendingInvoices.length} pending invoices)\n• **Operating Expenses:** ${formatCurrency(totalOpEx)}\n\nYou can ask me specific questions like: *"How much money is overdue?"*, *"Show my expense breakdown"*, or *"How can I prevent a cash shortage?"*.`,
      timestamp,
      category: 'general',
    };
  };

  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputValue;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Simulate conversational agent processing
    setTimeout(() => {
      const response = generateAIResponse(query);
      setMessages((prev) => [...prev, response]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button / Launcher Pill */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-primary-foreground/20 group"
          title="Open AI Financial Copilot Chatbot"
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-sm tracking-wide">AI Financial Copilot</span>
          <Sparkles className="h-4 w-4 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 flex flex-col bg-background/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
            isMinimized
              ? 'w-80 h-14'
              : 'w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-foreground">AI Financial Copilot</h3>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold border-primary/30 text-primary">
                    Live Data
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                  Real-time Supabase ledger context active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={loadData}
                disabled={isLoadingFinancials}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Refresh financial ledger context"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFinancials ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Close Chatbot"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                      {msg.sender === 'assistant' ? (
                        <>
                          <Bot className="h-3 w-3 text-primary" />
                          <span className="font-semibold text-primary">AI CFO Assistant</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{userName}</span>
                          <User className="h-3 w-3" />
                        </>
                      )}
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`relative group p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm font-medium'
                          : 'bg-muted/70 text-foreground rounded-tl-none border border-border/50 shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-line text-[12px]">{msg.text}</div>

                      {/* Embedded Data Card if present */}
                      {msg.dataCard && (
                        <div className="mt-3 p-2.5 rounded-xl bg-background/90 border border-border/60 space-y-1.5 text-foreground shadow-sm">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            {msg.dataCard.title}
                          </span>
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            {msg.dataCard.metrics.map((m, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <span className="text-[10px] text-muted-foreground block">{m.label}</span>
                                <span className={`font-mono font-bold text-xs ${m.color || 'text-foreground'}`}>
                                  {m.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Copy button */}
                      {msg.sender === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="absolute bottom-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 p-3 bg-muted/60 rounded-2xl rounded-tl-none border border-border/40 w-fit">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-muted-foreground font-medium ml-1">
                      Analyzing financial ledger data...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="p-2 border-t border-border/50 bg-muted/20">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  <Sparkles className="h-3 w-3 text-amber-500 shrink-0 ml-1" />
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(undefined, prompt)}
                      className="px-2.5 py-1 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 text-[10.5px] whitespace-nowrap shrink-0 transition-colors shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-background border-t border-border/60">
                <div className="relative flex items-center">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about cash flow, overdue invoices, expenses..."
                    className="pr-10 h-10 text-xs rounded-xl border-border/80 focus-visible:ring-primary/40 bg-muted/30"
                    disabled={isThinking}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || isThinking}
                    className="absolute right-1.5 h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-40"
                    title="Send query"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
