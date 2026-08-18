"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FolderKanban,
  History,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { loadRitmoState, saveRitmoState } from "@/lib/ritmo-data";

type Section =
  | "dashboard"
  | "routine"
  | "progress"
  | "finance"
  | "finance-entries"
  | "project"
  | "ideas"
  | "history";
type Pillar = string;
type Activity = {
  id: string;
  pillar: Pillar;
  title: string;
  day: number;
  time: string;
  practice?: boolean;
};
type ExpenseAccount = string;
type FinanceGroupColor =
  | "violet"
  | "orange"
  | "slate"
  | "blue"
  | "rose"
  | "cyan"
  | "amber"
  | "emerald";
type FinanceGroup = {
  id: string;
  name: string;
  color: FinanceGroupColor;
  kind: "income" | "expense";
};
type ExpensePreset = {
  kind: "income" | "expense";
  account: ExpenseAccount;
};
type Expense = {
  id: number;
  description: string;
  category: string;
  method: string;
  amount: number;
  date: string;
  kind: "income" | "expense";
  card?: "Inter" | "Nubank";
  account?: ExpenseAccount;
  seriesId?: number;
  installmentCurrent?: number;
  installmentsTotal?: number;
};
type Idea = {
  id: number;
  title: string;
  description: string;
  status: "Caixa de entrada" | "Explorando" | "Priorizada";
};
type ProjectNote = { id: number; text: string; date: string };
type AppState = {
  completed: Record<string, boolean>;
  practiceNotes: Record<string, string>;
  customActivities: Activity[];
  activityOverrides: Record<string, Activity>;
  deletedActivityIds: string[];
  deletedPillars: string[];
  customPillars: string[];
  customFinanceGroups: FinanceGroup[];
  deletedFinanceGroupIds: string[];
  expenses: Expense[];
  ideas: Idea[];
  projectNotes: ProjectNote[];
  budget: number;
  cardLimit: number;
};
type PracticeTarget = { activity: Activity; date: string };

const nav: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "routine", label: "Rotina", icon: CalendarDays },
  { id: "progress", label: "Progresso", icon: BarChart3 },
  { id: "project", label: "Projeto", icon: FolderKanban },
  { id: "ideas", label: "Ideias", icon: Lightbulb },
  { id: "history", label: "Histórico", icon: History },
];
const searchNav: {
  id: Section;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  ...nav.slice(0, 3),
  { id: "finance", label: "Finanças", icon: WalletCards },
  { id: "finance-entries", label: "Lançamentos", icon: CircleDollarSign },
  ...nav.slice(3),
];
const days = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const basePillars: string[] = [];
const defaultFinanceGroups: FinanceGroup[] = [];
const financeGroupTones: Record<FinanceGroupColor, string> = {
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};
const financeGroupColors: { value: FinanceGroupColor; label: string; swatch: string }[] = [
  { value: "violet", label: "Violeta", swatch: "bg-violet-500" },
  { value: "orange", label: "Laranja", swatch: "bg-orange-500" },
  { value: "blue", label: "Azul", swatch: "bg-blue-500" },
  { value: "rose", label: "Rosa", swatch: "bg-rose-500" },
  { value: "cyan", label: "Ciano", swatch: "bg-cyan-500" },
  { value: "amber", label: "Âmbar", swatch: "bg-amber-500" },
  { value: "emerald", label: "Verde", swatch: "bg-emerald-500" },
  { value: "slate", label: "Cinza", swatch: "bg-slate-500" },
];
const schedule: Activity[] = [];
const initialState: AppState = {
  completed: {},
  practiceNotes: {},
  customActivities: [],
  activityOverrides: {},
  deletedActivityIds: [],
  deletedPillars: [],
  customPillars: [],
  customFinanceGroups: [],
  deletedFinanceGroupIds: [],
  expenses: [],
  ideas: [],
  projectNotes: [],
  budget: 0,
  cardLimit: 0,
};
const expenseCategories = [
  "Alimentação",
  "Transporte",
  "Casa",
  "Assinaturas",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros",
];
const incomeCategories = [
  "Salário",
  "Cartão alimentação",
  "Freelance",
  "Reembolso",
  "Investimentos",
  "Outros",
];
const expenseMethods = [
  "Cartão de crédito",
  "Cartão de débito",
  "PIX",
  "Dinheiro",
];
const incomeMethods = ["PIX", "Transferência", "Dinheiro", "Outro"];
const pillarTone: Record<string, string> = {
  Inglês: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Produto: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Projeto: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Comunicação: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  Físico: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Finanças: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
};
const getPillarTone = (pillar: string) =>
  pillarTone[pillar] ?? "bg-slate-500/10 text-slate-700 dark:text-slate-300";
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function toLocalISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthKey() {
  return toLocalISO(new Date()).slice(0, 7);
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const label = monthFormatter.format(new Date(year, monthIndex - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shiftMonth(month: string, amount: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftISODateMonth(value: string, amount: number) {
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(year, month - 1 + amount, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  return toLocalISO(target);
}

function completionKey(activityId: string, date: string) {
  return `${date}::${activityId}`;
}

function dateForCurrentWeekday(day: number) {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay() + day);
  return toLocalISO(date);
}

function activityOccurrencesInMonth(activity: Activity, month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  const dates: string[] = [];
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, monthIndex - 1, day);
    if (date.getDay() === activity.day) dates.push(toLocalISO(date));
  }
  return dates;
}

function getActivities(state: AppState) {
  return [
    ...schedule.map(
      (activity) => state.activityOverrides[activity.id] ?? activity,
    ),
    ...state.customActivities,
  ].filter(
    (activity) =>
      !state.deletedActivityIds.includes(activity.id) &&
      !state.deletedPillars.includes(activity.pillar),
  );
}

function getActivePillars(state: AppState) {
  return [...new Set([...basePillars, ...state.customPillars])].filter(
    (pillar) => !state.deletedPillars.includes(pillar),
  );
}

function getFinanceGroups(state: AppState) {
  return [...defaultFinanceGroups, ...state.customFinanceGroups].filter(
    (group) => !state.deletedFinanceGroupIds.includes(group.id),
  );
}

function getExpenseGroupName(expense: Expense) {
  return (
    expense.account ??
    (expense.kind === "income"
      ? "Entradas"
      : (expense.card ?? "Outras despesas"))
  );
}

function Brand() {
  const { open } = useSidebar();
  return (
    <div className="flex h-12 items-center gap-2 px-2">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        R
      </div>
      {open && (
        <div>
          <p className="text-sm font-semibold leading-none">Ritmo</p>
          <p className="mt-1 text-xs text-muted-foreground">Sistema pessoal</p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("dashboard");
  const [financeMenuOpen, setFinanceMenuOpen] = useState(false);
  const [state, setState] = useState<AppState>(initialState);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const syncRevision = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [financeGroupOpen, setFinanceGroupOpen] = useState(false);
  const [pillarOpen, setPillarOpen] = useState(false);
  const [expensePreset, setExpensePreset] = useState<ExpensePreset | null>(
    null,
  );
  const [routineOpen, setRoutineOpen] = useState(false);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [practiceTarget, setPracticeTarget] = useState<PracticeTarget | null>(
    null,
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function initialize() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      const payload = await loadRitmoState<AppState>(supabase);
      if (!active) return;
      setUser(data.user);
      setState({ ...initialState, ...payload.state });
      setTheme(payload.theme ?? "light");
      setReady(true);
    }

    void initialize().catch(() => {
      if (active)
        setLoadError("Não foi possível carregar seus dados. Tente novamente.");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/login");
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);
  useEffect(() => {
    if (!ready) return;
    const revision = ++syncRevision.current;
    const timer = window.setTimeout(() => {
      setSyncStatus("saving");
      void saveRitmoState(createClient(), { state, theme })
        .then(() => {
          if (syncRevision.current === revision) setSyncStatus("saved");
        })
        .catch(() => {
          if (syncRevision.current === revision) setSyncStatus("error");
        });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [ready, state, theme]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleActivity = (
    activity: Activity,
    date = toLocalISO(new Date()),
  ) => {
    const key = completionKey(activity.id, date);
    if (activity.practice && !state.completed[key])
      return setPracticeTarget({ activity, date });
    setState((current) => {
      const practiceNotes = { ...current.practiceNotes };
      if (current.completed[key] && activity.practice)
        delete practiceNotes[key];
      return {
        ...current,
        practiceNotes,
        completed: { ...current.completed, [key]: !current.completed[key] },
      };
    });
  };
  const navigate = (id: Section) => {
    if (
      id !== "finance" &&
      id !== "finance-entries" &&
      selectedMonth > currentMonthKey()
    )
      setSelectedMonth(currentMonthKey());
    if (id === "finance" || id === "finance-entries") setFinanceMenuOpen(true);
    setSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">{loadError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </main>
    );
  }

  if (!ready || !user) {
    return (
      <main className="grid min-h-screen place-items-center" aria-label="Carregando Ritmo">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Brand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Organização</SidebarGroupLabel>
            <SidebarMenu>
              {nav.slice(0, 3).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={section === item.id}
                    tooltip={item.label}
                    onClick={() => navigate(item.id)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <FinanceSidebarMenu
                section={section}
                open={financeMenuOpen}
                onOpenChange={setFinanceMenuOpen}
                onNavigate={navigate}
              />
              {nav.slice(3).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={section === item.id}
                    tooltip={item.label}
                    onClick={() => navigate(item.id)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Profile
            user={user}
            syncStatus={syncStatus}
            onSignOut={async () => {
              await createClient().auth.signOut();
              router.replace("/login");
            }}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="outline"
            className="h-8 w-64 justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
            Buscar no Ritmo{" "}
            <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-label="Alternar tema"
                >
                  {theme === "light" ? <Moon /> : <Sun />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alternar tema</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell />
            </Button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1500px] p-4 md:p-6">
          {section === "dashboard" && (
            <Dashboard
              state={state}
              onToggle={toggleActivity}
              onNavigate={navigate}
            />
          )}
          {section === "routine" && (
            <Routine
              state={state}
              onToggle={toggleActivity}
              onAdd={() => {
                setEditingActivity(null);
                setRoutineOpen(true);
              }}
              onEdit={(activity) => {
                setEditingActivity(activity);
                setRoutineOpen(true);
              }}
              onDelete={(id) =>
                setState((s) => {
                  const completed = Object.fromEntries(
                    Object.entries(s.completed).filter(
                      ([key]) => !key.endsWith(`::${id}`) && key !== id,
                    ),
                  );
                  const practiceNotes = Object.fromEntries(
                    Object.entries(s.practiceNotes).filter(
                      ([key]) => !key.endsWith(`::${id}`) && key !== id,
                    ),
                  );
                  return {
                    ...s,
                    completed,
                    practiceNotes,
                    customActivities: s.customActivities.filter(
                      (activity) => activity.id !== id,
                    ),
                    deletedActivityIds: id.startsWith("custom-")
                      ? s.deletedActivityIds
                      : [...new Set([...s.deletedActivityIds, id])],
                  };
                })
              }
            />
          )}
          {section === "progress" && (
            <ProgressView
              state={state}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onAddPillar={() => setPillarOpen(true)}
              onDeletePillar={(pillar) =>
                setState((s) => {
                  const isBasePillar = basePillars.includes(pillar);
                  const removedActivityIds = new Set(
                    getActivities(s)
                      .filter((activity) => activity.pillar === pillar)
                      .map((activity) => activity.id),
                  );
                  const removedBaseActivityIds = [...removedActivityIds].filter(
                    (id) => schedule.some((activity) => activity.id === id),
                  );
                  const completed = Object.fromEntries(
                    Object.entries(s.completed).filter(([key]) => {
                      const activityId = key.includes("::")
                        ? key.slice(key.lastIndexOf("::") + 2)
                        : key;
                      return !removedActivityIds.has(activityId);
                    }),
                  );
                  const activityOverrides = Object.fromEntries(
                    Object.entries(s.activityOverrides).filter(
                      ([, activity]) => activity.pillar !== pillar,
                    ),
                  );
                  const practiceNotes = Object.fromEntries(
                    Object.entries(s.practiceNotes).filter(([key]) => {
                      const activityId = key.includes("::")
                        ? key.slice(key.lastIndexOf("::") + 2)
                        : key;
                      return !removedActivityIds.has(activityId);
                    }),
                  );

                  return {
                    ...s,
                    completed,
                    practiceNotes,
                    activityOverrides,
                    deletedPillars: [
                      ...new Set([...s.deletedPillars, pillar]),
                    ],
                    deletedActivityIds: isBasePillar
                      ? [
                          ...new Set([
                            ...s.deletedActivityIds,
                            ...removedBaseActivityIds,
                          ]),
                        ]
                      : s.deletedActivityIds,
                    customPillars: s.customPillars.filter(
                      (customPillar) => customPillar !== pillar,
                    ),
                    customActivities: s.customActivities.filter(
                      (activity) => activity.pillar !== pillar,
                    ),
                  };
                })
              }
            />
          )}
          {section === "finance" && (
            <Finance
              state={state}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onAdd={() => {
                setEditingExpense(null);
                setExpensePreset(null);
                setExpenseOpen(true);
              }}
            />
          )}
          {section === "finance-entries" && (
            <FinanceEntries
              state={state}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onAddEntry={(preset) => {
                setEditingExpense(null);
                setExpensePreset(preset ?? null);
                setExpenseOpen(true);
              }}
              onAddGroup={() => setFinanceGroupOpen(true)}
              onDeleteGroup={(group) =>
                setState((s) => ({
                  ...s,
                  deletedFinanceGroupIds: [
                    ...new Set([...s.deletedFinanceGroupIds, group.id]),
                  ],
                  customFinanceGroups: s.customFinanceGroups.filter(
                    (item) => item.id !== group.id,
                  ),
                  expenses: s.expenses.filter(
                    (expense) =>
                      expense.kind !== group.kind ||
                      getExpenseGroupName(expense) !== group.name,
                  ),
                }))
              }
              onEdit={(expense) => {
                setEditingExpense(expense);
                setExpensePreset(null);
                setExpenseOpen(true);
              }}
              onDelete={(expense, scope) =>
                setState((s) => ({
                  ...s,
                  expenses: s.expenses.filter((item) =>
                    scope === "series" && expense.seriesId
                      ? item.seriesId !== expense.seriesId
                      : item.id !== expense.id,
                  ),
                }))
              }
            />
          )}
          {section === "project" && (
            <Project
              state={state}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onAdd={() => {
                setEditingNote(null);
                setProjectOpen(true);
              }}
              onEdit={(note) => {
                setEditingNote(note);
                setProjectOpen(true);
              }}
              onDelete={(id) =>
                setState((s) => ({
                  ...s,
                  projectNotes: s.projectNotes.filter((note) => note.id !== id),
                }))
              }
            />
          )}
          {section === "ideas" && (
            <Ideas
              state={state}
              onAdd={() => setIdeaOpen(true)}
              onOpen={setSelectedIdea}
            />
          )}
          {section === "history" && (
            <HistoryView
              state={state}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          )}
        </div>
      </SidebarInset>
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={navigate}
      />
      <RoutineDialog
        key={`${editingActivity?.id ?? "new"}-${getActivePillars(state).join("|")}`}
        open={routineOpen}
        onOpenChange={setRoutineOpen}
        activity={editingActivity}
        pillars={getActivePillars(state)}
        onSubmit={(activities, newPillar) =>
          setState((s) => {
            const customPillars =
              newPillar &&
              ![...basePillars, ...s.customPillars].some(
                (item) =>
                  item.toLocaleLowerCase("pt-BR") ===
                  newPillar.toLocaleLowerCase("pt-BR"),
              )
                ? [...s.customPillars, newPillar]
                : s.customPillars;
            const deletedPillars = newPillar
              ? s.deletedPillars.filter(
                  (item) =>
                    item.toLocaleLowerCase("pt-BR") !==
                    newPillar.toLocaleLowerCase("pt-BR"),
                )
              : s.deletedPillars;
            if (!editingActivity)
              return {
                ...s,
                customPillars,
                deletedPillars,
                customActivities: [...s.customActivities, ...activities],
              };
            const [updated, ...copies] = activities;
            if (editingActivity.id.startsWith("custom-"))
              return {
                ...s,
                customPillars,
                deletedPillars,
                customActivities: [
                  ...s.customActivities.map((item) =>
                    item.id === editingActivity.id ? updated : item,
                  ),
                  ...copies,
                ],
              };
            return {
              ...s,
              customPillars,
              deletedPillars,
              activityOverrides: {
                ...s.activityOverrides,
                [editingActivity.id]: updated,
              },
              customActivities: [...s.customActivities, ...copies],
            };
          })
        }
      />
      <ExpenseDialog
        key={
          editingExpense?.id ??
          `new-${selectedMonth}-${expensePreset?.kind ?? "free"}-${expensePreset?.account ?? ""}`
        }
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        expense={editingExpense}
        preset={expensePreset}
        financeGroups={getFinanceGroups(state)}
        selectedMonth={selectedMonth}
        onSubmit={(expenses) =>
          setState((s) => ({
            ...s,
            expenses: editingExpense
              ? s.expenses.map((item) =>
                  item.id === editingExpense.id ? expenses[0] : item,
                )
              : [...expenses, ...s.expenses],
          }))
        }
      />
      <PillarDialog
        open={pillarOpen}
        onOpenChange={setPillarOpen}
        pillars={getActivePillars(state)}
        onSubmit={(pillar) =>
          setState((s) => ({
            ...s,
            deletedPillars: s.deletedPillars.filter(
              (item) =>
                item.toLocaleLowerCase("pt-BR") !==
                pillar.toLocaleLowerCase("pt-BR"),
            ),
            customPillars: basePillars.some(
              (item) =>
                item.toLocaleLowerCase("pt-BR") ===
                pillar.toLocaleLowerCase("pt-BR"),
            )
              ? s.customPillars
              : [...s.customPillars, pillar],
          }))
        }
      />
      <FinanceGroupDialog
        open={financeGroupOpen}
        onOpenChange={setFinanceGroupOpen}
        groups={getFinanceGroups(state)}
        onSubmit={(group) =>
          setState((s) => ({
            ...s,
            customFinanceGroups: [...s.customFinanceGroups, group],
          }))
        }
      />
      <IdeaDialog
        open={ideaOpen}
        onOpenChange={setIdeaOpen}
        onSubmit={(idea) =>
          setState((s) => ({ ...s, ideas: [idea, ...s.ideas] }))
        }
      />
      {selectedIdea && (
        <IdeaDetailDialog
          key={selectedIdea.id}
          idea={selectedIdea}
          onOpenChange={(open) => !open && setSelectedIdea(null)}
          onSave={(idea) => {
            setState((s) => ({
              ...s,
              ideas: s.ideas.map((item) => (item.id === idea.id ? idea : item)),
            }));
            setSelectedIdea(null);
          }}
          onDelete={(id) => {
            setState((s) => ({
              ...s,
              ideas: s.ideas.filter((item) => item.id !== id),
            }));
            setSelectedIdea(null);
          }}
        />
      )}
      <NoteDialog
        key={editingNote?.id ?? "new"}
        open={projectOpen}
        onOpenChange={setProjectOpen}
        note={editingNote}
        onSubmit={(note) =>
          setState((s) => ({
            ...s,
            projectNotes: editingNote
              ? s.projectNotes.map((item) =>
                  item.id === editingNote.id ? { ...item, text: note } : item,
                )
              : [
                  { id: Date.now(), text: note, date: toLocalISO(new Date()) },
                  ...s.projectNotes,
                ],
          }))
        }
      />
      <PracticeDialog
        key={
          practiceTarget
            ? completionKey(practiceTarget.activity.id, practiceTarget.date)
            : "practice-closed"
        }
        target={practiceTarget}
        onClose={() => setPracticeTarget(null)}
        onConfirm={(practiceNote) => {
          if (practiceTarget) {
            const key = completionKey(
              practiceTarget.activity.id,
              practiceTarget.date,
            );
            setState((s) => ({
              ...s,
              completed: { ...s.completed, [key]: true },
              practiceNotes: {
                ...s.practiceNotes,
                [key]: practiceNote.trim(),
              },
            }));
          }
          setPracticeTarget(null);
        }}
      />
    </SidebarProvider>
  );
}

function Profile({
  user,
  syncStatus,
  onSignOut,
}: {
  user: User;
  syncStatus: "saved" | "saving" | "error";
  onSignOut: () => Promise<void>;
}) {
  const { open } = useSidebar();
  const name = String(user.user_metadata.full_name ?? user.email ?? "Usuário");
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const statusLabel =
    syncStatus === "saving"
      ? "Salvando…"
      : syncStatus === "error"
        ? "Erro ao salvar"
        : "Dados salvos";
  return (
    <div className="flex items-center gap-2 px-1">
      <Avatar className="size-8">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {open && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{statusLabel}</p>
        </div>
      )}
      {open && (
        <Button
          className="ml-auto"
          variant="ghost"
          size="icon"
          aria-label="Sair"
          onClick={() => void onSignOut()}
        >
          <LogOut />
        </Button>
      )}
    </div>
  );
}

function FinanceSidebarMenu({
  section,
  open,
  onOpenChange,
  onNavigate,
}: {
  section: Section;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (section: Section) => void;
}) {
  const { open: sidebarOpen } = useSidebar();
  const financeActive = section === "finance" || section === "finance-entries";
  if (!sidebarOpen) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={financeActive}
          tooltip="Finanças"
          onClick={() => onNavigate("finance")}
        >
          <WalletCards />
          <span>Finanças</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <div className="flex items-center gap-1">
        <SidebarMenuButton
          className="min-w-0 flex-1"
          isActive={section === "finance"}
          onClick={() => onNavigate("finance")}
        >
          <WalletCards />
          <span>Finanças</span>
        </SidebarMenuButton>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onOpenChange(!open)}
          aria-label={
            open ? "Fechar submenu de finanças" : "Abrir submenu de finanças"
          }
          aria-expanded={open}
        >
          <ChevronDown
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
      {open && (
        <ul className="ml-4 mt-1 border-l pl-3">
          <li>
            <SidebarMenuButton
              className="h-8"
              isActive={section === "finance-entries"}
              onClick={() => onNavigate("finance-entries")}
            >
              <CircleDollarSign />
              <span>Lançamentos</span>
            </SidebarMenuButton>
          </li>
        </ul>
      )}
    </SidebarMenuItem>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function MonthNavigator({
  month,
  onChange,
  allowFuture = false,
}: {
  month: string;
  onChange: (month: string) => void;
  allowFuture?: boolean;
}) {
  const isCurrent = month === currentMonthKey();
  const nextDisabled = !allowFuture && month >= currentMonthKey();
  return (
    <div className="flex items-center gap-2" aria-label="Navegação por mês">
      <div className="flex items-center rounded-lg border bg-background shadow-xs">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-r-none"
              onClick={() => onChange(shiftMonth(month, -1))}
              aria-label="Ver mês anterior"
            >
              <ChevronLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mês anterior</TooltipContent>
        </Tooltip>
        <div className="min-w-40 border-x px-3 text-center text-sm font-medium capitalize">
          {monthLabel(month)}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-l-none"
              disabled={nextDisabled}
              onClick={() => onChange(shiftMonth(month, 1))}
              aria-label="Ver próximo mês"
            >
              <ChevronRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {nextDisabled ? "O histórico termina no mês atual" : "Próximo mês"}
          </TooltipContent>
        </Tooltip>
      </div>
      {!isCurrent && (
        <Button variant="outline" onClick={() => onChange(currentMonthKey())}>
          Hoje
        </Button>
      )}
    </div>
  );
}

function PageActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {children}
    </div>
  );
}

function Dashboard({
  state,
  onToggle,
  onNavigate,
}: {
  state: AppState;
  onToggle: (a: Activity, date?: string) => void;
  onNavigate: (s: Section) => void;
}) {
  const day = new Date().getDay();
  const todayKey = toLocalISO(new Date());
  const activities = getActivities(state);
  const today = activities.filter((a) => a.day === day);
  const weekDates = Object.fromEntries(
    days.map((_, index) => [index, dateForCurrentWeekday(index)]),
  );
  const done = activities.filter(
    (a) => state.completed[completionKey(a.id, weekDates[a.day])],
  ).length;
  const monthExpenses = state.expenses.filter((item) =>
    item.date.startsWith(currentMonthKey()),
  );
  const totalSpent = monthExpenses
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = monthExpenses
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const completion = Math.round((done / activities.length) * 100) || 0;
  return (
    <>
      <PageTitle
        eyebrow="Visão geral"
        title="Bom dia, Willian"
        description={`${days[day]}, ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date())}. Seu plano está em movimento.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ritmo semanal"
          value={`${completion}%`}
          note={`${done} de ${activities.length} atividades`}
          icon={TrendingUp}
        />
        <MetricCard
          label="Sequência"
          value="0 dias"
          note="Comece concluindo o primeiro bloco"
          icon={Target}
        />
        <MetricCard
          label="Saldo financeiro"
          value={money.format(totalIncome - totalSpent)}
          note={`${money.format(totalIncome)} em entradas`}
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Projeto principal"
          value="0%"
          note="Nenhum avanço registrado"
          icon={FolderKanban}
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Agenda de hoje</CardTitle>
            <CardDescription>
              Conclua o que importa, com prática quando necessário.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                {
                  today.filter(
                    (a) => state.completed[completionKey(a.id, todayKey)],
                  ).length
                }
                /{today.length} concluídas
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {today.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                checked={
                  !!state.completed[completionKey(activity.id, todayKey)]
                }
                onToggle={() => onToggle(activity, todayKey)}
              />
            ))}
          </CardContent>
          <CardFooter className="border-t">
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={() => onNavigate("routine")}
            >
              Ver rotina completa <ChevronRight />
            </Button>
          </CardFooter>
        </Card>
        <div className="grid gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardDescription className="text-primary-foreground/70">
                Foco da semana
              </CardDescription>
              <CardTitle className="text-xl">
                Consistência antes de intensidade.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-primary-foreground/75">
                Proteja os blocos de prática. Se o dia apertar, reduza o escopo
                — não quebre o ritmo.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por pilar</CardTitle>
              <CardDescription>
                Atividades concluídas nesta semana.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getActivePillars(state)
                .filter((pillar) => pillar !== "Finanças")
                .map((pillar) => {
                const all = activities.filter((a) => a.pillar === pillar);
                const value =
                  Math.round(
                    (all.filter(
                      (a) =>
                        state.completed[completionKey(a.id, weekDates[a.day])],
                    ).length /
                      all.length) *
                      100,
                  ) || 0;
                return (
                  <div key={pillar}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span>{pillar}</span>
                      <span className="font-mono text-muted-foreground">
                        {value}%
                      </span>
                    </div>
                    <Progress value={value} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Target;
}) {
  return (
    <Card className="@container/card bg-gradient-to-t from-primary/5 to-card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <div className="grid size-8 place-items-center rounded-lg bg-muted">
            <Icon className="size-4" />
          </div>
        </CardAction>
      </CardHeader>
      <CardFooter className="text-xs text-muted-foreground">{note}</CardFooter>
    </Card>
  );
}

function ActivityRow({
  activity,
  checked,
  onToggle,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  checked: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/50">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={`Concluir ${activity.title}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm font-medium ${checked ? "text-muted-foreground line-through" : ""}`}
          >
            {activity.title}
          </p>
          {activity.practice && (
            <Badge variant="outline" className="text-[10px]">
              prática
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
      </div>
      <Badge className={getPillarTone(activity.pillar)} variant="secondary">
        {activity.pillar}
      </Badge>
      {onEdit && onDelete && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={`Editar ${activity.title}`}
          >
            <Pencil />
          </Button>
          <DeleteAction
            label="Excluir bloco"
            description={`O bloco “${activity.title}” será removido da rotina semanal.`}
            onConfirm={onDelete}
          />
        </div>
      )}
    </div>
  );
}

function Routine({
  state,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}: {
  state: AppState;
  onToggle: (a: Activity, date?: string) => void;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}) {
  const activities = getActivities(state);
  return (
    <>
      <PageTitle
        eyebrow="Planejamento"
        title="Rotina semanal"
        description="Uma cadência sustentável e totalmente ajustável."
        action={
          <Button onClick={onAdd}>
            <Plus />
            Novo bloco
          </Button>
        }
      />
      <Tabs defaultValue={String(new Date().getDay())}>
        <TabsList className="mb-4 flex w-full justify-start overflow-x-auto">
          {days.map((day, index) => (
            <TabsTrigger key={day} value={String(index)} className="min-w-24">
              {day.replace("-feira", "")}
            </TabsTrigger>
          ))}
        </TabsList>
        {days.map((day, index) => {
          const date = dateForCurrentWeekday(index);
          return (
            <TabsContent key={day} value={String(index)}>
              <Card>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
                  <CardDescription>
                    {activities.filter((a) => a.day === index).length} blocos
                    planejados para a semana atual
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  {activities
                    .filter((a) => a.day === index)
                    .map((a) => (
                      <ActivityRow
                        key={a.id}
                        activity={a}
                        checked={!!state.completed[completionKey(a.id, date)]}
                        onToggle={() => onToggle(a, date)}
                        onEdit={() => onEdit(a)}
                        onDelete={() => onDelete(a.id)}
                      />
                    ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}

function ProgressView({
  state,
  selectedMonth,
  onMonthChange,
  onAddPillar,
  onDeletePillar,
}: {
  state: AppState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAddPillar: () => void;
  onDeletePillar: (pillar: string) => void;
}) {
  const activities = getActivities(state);
  const pillars = getActivePillars(state).map((pillar) => {
    const pillarActivities = activities.filter((a) => a.pillar === pillar);
    const occurrences = pillarActivities.flatMap((activity) =>
      activityOccurrencesInMonth(activity, selectedMonth).map((date) => ({
        activity,
        date,
      })),
    );
    return {
      pillar,
      linkedActivities: pillarActivities.length,
      total: occurrences.length,
      done: occurrences.filter(
        ({ activity, date }) =>
          state.completed[completionKey(activity.id, date)],
      ).length,
    };
  });
  const overallTotal = pillars.reduce((sum, item) => sum + item.total, 0);
  const overallDone = pillars.reduce((sum, item) => sum + item.done, 0);
  const overallPercent = Math.round((overallDone / overallTotal) * 100) || 0;
  const ranked = pillars
    .filter((item) => item.done > 0)
    .sort((a, b) => b.done / b.total - a.done / a.total);
  return (
    <>
      <PageTitle
        eyebrow="Evolução"
        title="Progresso"
        description={`Sinais objetivos de ${monthLabel(selectedMonth).toLocaleLowerCase("pt-BR")}.`}
        action={
          <PageActions>
            <MonthNavigator month={selectedMonth} onChange={onMonthChange} />
            <Button onClick={onAddPillar}>
              <Plus />
              Adicionar pilar
            </Button>
          </PageActions>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pillars.map(({ pillar, linkedActivities, total, done }) => {
          const percent = Math.round((done / total) * 100) || 0;
          return (
            <Card key={pillar}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${getPillarTone(pillar).split(" ")[0]}`}
                  />
                  {pillar}
                </CardTitle>
                <CardAction className="flex items-center gap-1">
                  <Badge variant="outline">
                    {done}/{total}
                  </Badge>
                  <DeleteAction
                    label={`Excluir pilar ${pillar}`}
                    description={
                      linkedActivities === 0
                        ? `O pilar “${pillar}” será removido. Esta ação não pode ser desfeita.`
                        : `O pilar “${pillar}” e seus ${linkedActivities} ${linkedActivities === 1 ? "bloco vinculado" : "blocos vinculados"} serão removidos. As conclusões e práticas desses blocos também serão apagadas. Esta ação não pode ser desfeita.`
                    }
                    onConfirm={() => onDeletePillar(pillar)}
                  />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-3xl font-semibold tabular-nums">
                    {percent}%
                  </span>
                  <span className="text-xs text-muted-foreground">no mês</span>
                </div>
                <Progress value={percent} />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Leitura do mês</CardTitle>
          <CardDescription>
            Os indicadores acompanham a competência selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Insight
            title="Maior consistência"
            value={ranked[0]?.pillar ?? "Sem dados"}
            note={
              ranked[0]
                ? `${ranked[0].done} conclusões no período`
                : "Conclua atividades para comparar"
            }
          />
          <Insight
            title="Atividades concluídas"
            value={String(overallDone)}
            note={`de ${overallTotal} ocorrências planejadas`}
          />
          <Insight
            title="Ritmo geral"
            value={`${overallPercent}%`}
            note={
              overallDone
                ? "Resultado da competência"
                : "Sua jornada começa no primeiro check"
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
function Insight({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function getMonthlyFinance(state: AppState, selectedMonth: string) {
  const monthlyExpenses = state.expenses
    .filter((expense) => expense.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));
  const incomes = monthlyExpenses.filter(
    (expense) => expense.kind === "income",
  );
  const expenses = monthlyExpenses.filter(
    (expense) => expense.kind === "expense",
  );
  const byGroup = (group: FinanceGroup, source = monthlyExpenses) =>
    source.filter(
      (expense) =>
        expense.kind === group.kind &&
        getExpenseGroupName(expense) === group.name,
    );
  const groups = getFinanceGroups(state).map((group) => {
    const items = byGroup(group);
    const linkedEntries = byGroup(group, state.expenses).length;
    return {
      ...group,
      items,
      linkedEntries,
      total: items.reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const total = (items: Expense[]) =>
    items.reduce((sum, item) => sum + item.amount, 0);
  const income = total(incomes);
  const spent = total(expenses);
  const leftover = income - spent;
  return {
    monthlyExpenses,
    incomes,
    expenses,
    groups,
    income,
    spent,
    leftover,
  };
}

function Finance({
  state,
  selectedMonth,
  onMonthChange,
  onAdd,
}: {
  state: AppState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAdd: () => void;
}) {
  const {
    monthlyExpenses,
    incomes,
    expenses,
    groups,
    income,
    spent,
    leftover,
  } = getMonthlyFinance(state, selectedMonth);
  return (
    <>
      <PageTitle
        eyebrow="Controle"
        title="Finanças"
        description={`Planejamento financeiro de ${monthLabel(selectedMonth).toLocaleLowerCase("pt-BR")}.`}
        action={
          <PageActions>
            <MonthNavigator
              month={selectedMonth}
              onChange={onMonthChange}
              allowFuture
            />
            <Button onClick={onAdd}>
              <Plus />
              Nova movimentação
            </Button>
          </PageActions>
        }
      />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Entradas"
            value={money.format(income)}
            note={
              income
                ? `${incomes.length} receitas previstas`
                : "Nenhuma entrada cadastrada"
            }
            icon={TrendingUp}
          />
          <MetricCard
            label="Saídas"
            value={money.format(spent)}
            note={
              spent
                ? `${expenses.length} despesas previstas`
                : "Nenhuma saída cadastrada"
            }
            icon={WalletCards}
          />
          <MetricCard
            label="Sobra do mês"
            value={money.format(leftover)}
            note={
              leftover >= 0
                ? "Disponível após as despesas"
                : "Despesas acima das entradas"
            }
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Blocos financeiros"
            value={String(groups.length)}
            note={`${groups.filter((group) => group.kind === "expense").length} de saída • ${groups.filter((group) => group.kind === "income").length} de entrada`}
            icon={WalletCards}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Composição do mês</CardTitle>
            <CardDescription>
              Uma leitura rápida das mesmas áreas que você controla na planilha.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {groups.map((group) => (
              <Insight
                key={group.id}
                title={group.name}
                value={money.format(group.total)}
                note={`${group.items.length} lançamentos`}
              />
            ))}
          </CardContent>
        </Card>
        {monthlyExpenses.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={WalletCards}
                title="Este mês ainda não foi planejado"
                description="Cadastre receitas, despesas ou uma compra parcelada. As parcelas futuras serão criadas automaticamente."
                action="Criar primeiro lançamento"
                onAction={onAdd}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function FinanceEntries({
  state,
  selectedMonth,
  onMonthChange,
  onAddEntry,
  onAddGroup,
  onDeleteGroup,
  onEdit,
  onDelete,
}: {
  state: AppState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAddEntry: (preset?: ExpensePreset) => void;
  onAddGroup: () => void;
  onDeleteGroup: (group: FinanceGroup) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense, scope: "single" | "series") => void;
}) {
  const { groups } = getMonthlyFinance(state, selectedMonth);
  return (
    <>
      <PageTitle
        eyebrow="Finanças"
        title="Lançamentos"
        description={`Receitas e despesas de ${monthLabel(selectedMonth).toLocaleLowerCase("pt-BR")}, organizadas por conta.`}
        action={
          <PageActions>
            <MonthNavigator
              month={selectedMonth}
              onChange={onMonthChange}
              allowFuture
            />
            <Button onClick={onAddGroup}>
              <Plus />
              Novo bloco
            </Button>
          </PageActions>
        }
      />
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {groups.map((group) => (
          <FinanceLedgerCard
            key={group.id}
            title={group.name}
            tone={financeGroupTones[group.color]}
            items={group.items}
            onDeleteGroup={() => onDeleteGroup(group)}
            linkedEntries={group.linkedEntries}
            onAdd={() =>
              onAddEntry({ kind: group.kind, account: group.name })
            }
            onEdit={onEdit}
            onDelete={onDelete}
            income={group.kind === "income"}
          />
        ))}
      </div>
    </>
  );
}

function FinanceLedgerCard({
  title,
  tone,
  items,
  income = false,
  onAdd,
  onDeleteGroup,
  linkedEntries = 0,
  onEdit,
  onDelete,
}: {
  title: string;
  tone: string;
  items: Expense[];
  income?: boolean;
  onAdd: () => void;
  onDeleteGroup?: () => void;
  linkedEntries?: number;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense, scope: "single" | "series") => void;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return (
    <Card className="flex h-full min-h-[22rem] overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Badge variant="secondary" className={tone}>
            {title}
          </Badge>
        </CardTitle>
        <CardDescription>
          {items.length
            ? `${items.length} lançamentos nesta competência`
            : "Nenhum lançamento neste mês"}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onAdd}>
            <Plus />
            Adicionar
          </Button>
          {onDeleteGroup && (
            <DeleteAction
              label={`Excluir bloco ${title}`}
              description={
                linkedEntries === 0
                  ? `O bloco “${title}” será removido. Esta ação não pode ser desfeita.`
                  : `O bloco “${title}” e seus ${linkedEntries} ${linkedEntries === 1 ? "lançamento vinculado" : "lançamentos vinculados"} serão removidos de todos os meses, incluindo parcelas futuras. Esta ação não pode ser desfeita.`
              }
              onConfirm={onDeleteGroup}
            />
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        {items.length === 0 ? (
          <div className="grid h-full min-h-40 place-items-center px-6 py-10 text-center text-sm text-muted-foreground">
            Os lançamentos aparecerão aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-16">
                    {income ? "Origem" : "Parc."}
                  </TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {income
                        ? item.method
                        : item.installmentsTotal
                          ? `${item.installmentCurrent}/${item.installmentsTotal}`
                          : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${income ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {money.format(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          aria-label={`Editar ${item.description}`}
                        >
                          <Pencil />
                        </Button>
                        {item.seriesId &&
                        item.installmentsTotal &&
                        item.installmentsTotal > 1 ? (
                          <InstallmentDeleteAction
                            expense={item}
                            onDelete={onDelete}
                          />
                        ) : (
                          <DeleteAction
                            label="Excluir movimentação"
                            description={`A movimentação “${item.description}” será removida permanentemente.`}
                            onConfirm={() => onDelete(item, "single")}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto justify-between border-t bg-muted/20">
        <span className="text-sm font-medium">Total</span>
        <span className="text-base font-semibold tabular-nums tracking-tight">
          {money.format(total)}
        </span>
      </CardFooter>
    </Card>
  );
}

function InstallmentDeleteAction({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: (expense: Expense, scope: "single" | "series") => void;
}) {
  const [scope, setScope] = useState<"single" | "series">("single");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={`Excluir ${expense.description}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir compra parcelada?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está na parcela {expense.installmentCurrent}/
            {expense.installmentsTotal} de “{expense.description}”.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={`delete-scope-${expense.id}`}>
            O que deseja excluir?
          </Label>
          <Select
            value={scope}
            onValueChange={(value) => setScope(value as "single" | "series")}
          >
            <SelectTrigger id={`delete-scope-${expense.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Somente esta parcela</SelectItem>
              <SelectItem value="series">
                Todas as parcelas desta compra
              </SelectItem>
            </SelectContent>
          </Select>
          {scope === "series" && (
            <p className="text-xs leading-5 text-destructive">
              Todas as parcelas, inclusive as dos próximos meses, serão
              removidas.
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(expense, scope)}>
            {scope === "series"
              ? "Excluir todas as parcelas"
              : "Excluir parcela"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Project({
  state,
  selectedMonth,
  onMonthChange,
  onAdd,
  onEdit,
  onDelete,
}: {
  state: AppState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAdd: () => void;
  onEdit: (note: ProjectNote) => void;
  onDelete: (id: number) => void;
}) {
  const projectProgress = Math.min(state.projectNotes.length * 10, 100);
  const allNotes = [...state.projectNotes].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const latest = allNotes[0];
  const monthlyNotes = allNotes.filter((note) =>
    note.date.startsWith(selectedMonth),
  );
  return (
    <>
      <PageTitle
        eyebrow="Execução"
        title="Projeto principal"
        description={`Acompanhe as evidências de avanço de ${monthLabel(selectedMonth).toLocaleLowerCase("pt-BR")}.`}
        action={
          <PageActions>
            <MonthNavigator month={selectedMonth} onChange={onMonthChange} />
            <Button onClick={onAdd}>
              <Plus />
              Registrar avanço
            </Button>
          </PageActions>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Seu projeto principal</CardTitle>
            <CardDescription>
              O progresso geral é construído a partir de todos os seus
              registros.
            </CardDescription>
            <CardAction>
              <Badge variant={latest ? "default" : "outline"}>
                {latest ? "Em andamento" : "Ainda não iniciado"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span>Progresso registrado</span>
              <span className="font-mono">{projectProgress}%</span>
            </div>
            <Progress value={projectProgress} />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Insight
                title="Prazo"
                value="Não definido"
                note="Configure quando estiver pronto"
              />
              <Insight
                title="Avanços no mês"
                value={String(monthlyNotes.length)}
                note={`em ${monthLabel(selectedMonth).toLocaleLowerCase("pt-BR")}`}
              />
              <Insight
                title="Próxima ação"
                value={latest ? "Continuar" : "Começar"}
                note={
                  latest
                    ? "Registre o próximo avanço"
                    : "Registre o primeiro avanço"
                }
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximo passo</CardTitle>
            <CardDescription>
              {latest
                ? "Continue a partir do último avanço geral."
                : "A menor ação que move o projeto."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latest ? (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <div>
                  <Badge variant="outline">Último avanço</Badge>
                  <p className="mt-3 text-sm leading-6">{latest.text}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {new Date(`${latest.date}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
                <Button className="w-full" onClick={onAdd}>
                  <Plus />
                  Registrar próximo avanço
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="Nada definido ainda"
                description="Registre o primeiro avanço para iniciar."
                action="Começar agora"
                onAction={onAdd}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Avanços do mês</CardTitle>
          <CardDescription>
            Edite ou exclua qualquer registro da competência selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthlyNotes.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Nenhum avanço neste mês"
              description="Use a navegação para consultar outro período ou registre o próximo avanço."
              action={
                selectedMonth === currentMonthKey()
                  ? "Registrar avanço"
                  : undefined
              }
              onAction={selectedMonth === currentMonthKey() ? onAdd : undefined}
            />
          ) : (
            monthlyNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-start gap-3 rounded-lg border p-4"
              >
                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6">{note.text}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {new Date(`${note.date}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(note)}
                    aria-label="Editar avanço"
                  >
                    <Pencil />
                  </Button>
                  <DeleteAction
                    label="Excluir avanço"
                    description="Este avanço será removido permanentemente da linha do tempo."
                    onConfirm={() => onDelete(note.id)}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Ideas({
  state,
  onAdd,
  onOpen,
}: {
  state: AppState;
  onAdd: () => void;
  onOpen: (idea: Idea) => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow="Exploração"
        title="Banco de ideias"
        description="Capture primeiro. Decida com calma depois."
        action={
          <Button onClick={onAdd}>
            <Plus />
            Nova ideia
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.ideas.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <CardTitle>{idea.title}</CardTitle>
              <CardAction>
                <Badge
                  variant={
                    idea.status === "Priorizada" ? "default" : "secondary"
                  }
                >
                  {idea.status}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                {idea.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => onOpen(idea)}
              >
                Abrir <ChevronRight />
              </Button>
            </CardFooter>
          </Card>
        ))}
        <button
          onClick={onAdd}
          className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="mb-2 size-5" />
          <span className="text-sm font-medium">Capturar nova ideia</span>
        </button>
      </div>
    </>
  );
}

function HistoryView({
  state,
  selectedMonth,
  onMonthChange,
}: {
  state: AppState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [pillarFilter, setPillarFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const completed = getActivities(state)
    .flatMap((activity) =>
      activityOccurrencesInMonth(activity, selectedMonth)
        .filter((date) => state.completed[completionKey(activity.id, date)])
        .map((date) => ({
          activity,
          date,
          practiceNote: state.practiceNotes[completionKey(activity.id, date)],
        })),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const availablePillars = [
    ...new Set(completed.map(({ activity }) => activity.pillar)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = completed.filter(({ activity, practiceNote }) => {
    const matchesQuery =
      !normalizedQuery ||
      activity.title.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      practiceNote?.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    const matchesPillar =
      pillarFilter === "all" || activity.pillar === pillarFilter;
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "practice" ? activity.practice : !activity.practice);
    return matchesQuery && matchesPillar && matchesType;
  });
  const itemsByDate = filtered.reduce<
    Record<string, (typeof filtered)[number][]>
  >((groups, item) => {
    (groups[item.date] ??= []).push(item);
    return groups;
  }, {});
  const filteredDates = Object.keys(itemsByDate).sort((a, b) =>
    b.localeCompare(a),
  );
  const activeDate =
    selectedDate && itemsByDate[selectedDate]
      ? selectedDate
      : (filteredDates[0] ?? null);
  const activeItems = activeDate ? itemsByDate[activeDate] : [];
  const [calendarYear, calendarMonth] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
  const firstWeekday = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    return { day, date, count: itemsByDate[date]?.length ?? 0 };
  });
  const completedDays = new Set(completed.map(({ date }) => date)).size;
  const practiceCount = completed.filter(
    ({ activity }) => activity.practice,
  ).length;
  const hasActiveFilters =
    !!query || pillarFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setPillarFilter("all");
    setTypeFilter("all");
  };

  return (
    <>
      <PageTitle
        eyebrow="Memória"
        title="Histórico"
        description={`O que foi concluído em ${monthLabel(selectedMonth).toLocaleLowerCase("pt-BR")}.`}
        action={
          <MonthNavigator month={selectedMonth} onChange={onMonthChange} />
        }
      />
      {completed.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={History}
              title="Nenhuma atividade concluída neste mês"
              description="Use a navegação acima para consultar outro período."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Card className="gap-1 py-4">
              <CardHeader className="px-4">
                <CardDescription>Conclusões</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {completed.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="gap-1 py-4">
              <CardHeader className="px-4">
                <CardDescription>Dias com atividade</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {completedDays}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="gap-1 py-4">
              <CardHeader className="px-4">
                <CardDescription>Práticas registradas</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {practiceCount}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="mb-4 py-4">
            <CardContent className="grid gap-3 px-4 md:grid-cols-[minmax(220px,1fr)_200px_180px_auto] md:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar atividade ou prática..."
                  className="pl-9"
                  aria-label="Buscar no histórico"
                />
              </div>
              <Select value={pillarFilter} onValueChange={setPillarFilter}>
                <SelectTrigger aria-label="Filtrar por pilar">
                  <SelectValue placeholder="Todos os pilares" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pilares</SelectItem>
                  {availablePillars.map((pillar) => (
                    <SelectItem key={pillar} value={pillar}>
                      {pillar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger aria-label="Filtrar por tipo">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="practice">Teoria + prática</SelectItem>
                  <SelectItem value="execution">Execução</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                <X />
                Limpar
              </Button>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Search}
                  title="Nenhuma conclusão encontrada"
                  description="Ajuste a busca ou limpe os filtros para ver outras atividades."
                  action="Limpar filtros"
                  onAction={clearFilters}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    Visão do mês
                  </CardTitle>
                  <CardDescription>
                    Selecione um dia para consultar as atividades. Os números
                    indicam quantas conclusões foram registradas.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="outline">
                      {filteredDates.length}{" "}
                      {filteredDates.length === 1 ? "dia ativo" : "dias ativos"}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (weekday) => (
                        <span key={weekday} className="py-1">
                          {weekday}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstWeekday }, (_, index) => (
                      <span key={`empty-${index}`} aria-hidden="true" />
                    ))}
                    {calendarDays.map(({ day, date, count }) => {
                      const isSelected = date === activeDate;
                      return (
                        <Button
                          key={date}
                          type="button"
                          variant={isSelected ? "default" : "ghost"}
                          className={`h-14 flex-col gap-0.5 px-1 py-1 sm:h-16 ${
                            count === 0
                              ? "text-muted-foreground/50"
                              : isSelected
                                ? ""
                                : "bg-muted/40"
                          }`}
                          disabled={count === 0}
                          onClick={() => setSelectedDate(date)}
                          aria-label={`${day} de ${monthLabel(selectedMonth)}, ${count} ${count === 1 ? "conclusão" : "conclusões"}`}
                        >
                          <span className="text-sm font-medium tabular-nums">
                            {day}
                          </span>
                          {count > 0 && (
                            <span
                              className={`text-[10px] tabular-nums ${
                                isSelected
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {count} {count === 1 ? "item" : "itens"}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="min-h-[28rem]">
                <CardHeader className="border-b bg-muted/20">
                  <CardDescription>Atividades do dia</CardDescription>
                  <CardTitle className="text-base">
                    {activeDate &&
                      new Date(`${activeDate}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        },
                      )}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="secondary">
                      {activeItems.length}{" "}
                      {activeItems.length === 1 ? "conclusão" : "conclusões"}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="max-h-[25rem] divide-y overflow-y-auto">
                  {activeItems.map(({ activity, practiceNote }) => (
                    <div
                      key={completionKey(activity.id, activeDate ?? "")}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{activity.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {activity.practice
                              ? "Teoria + prática"
                              : "Execução"}
                          </p>
                        </div>
                        <Badge
                          className={getPillarTone(activity.pillar)}
                          variant="secondary"
                        >
                          {activity.pillar}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" />
                        </span>
                        <p>
                          {activity.practice ? (
                            <>
                              <span className="font-medium text-foreground">
                                Prática:{" "}
                              </span>
                              {practiceNote || "Sem registro nesta conclusão"}
                            </>
                          ) : (
                            "Atividade executada"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}

function SearchDialog({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (s: Section) => void;
}) {
  const [query, setQuery] = useState("");
  const results = searchNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar no Ritmo</DialogTitle>
          <DialogDescription>Navegue para uma seção.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite uma seção..."
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="p-2">
          {results.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onNavigate(item.id);
                onOpenChange(false);
              }}
            >
              <item.icon />
              {item.label}
              <ChevronRight className="ml-auto" />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PillarDialog({
  open,
  onOpenChange,
  pillars,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillars: string[];
  onSubmit: (pillar: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setError("");
    }
    onOpenChange(nextOpen);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pillar = name.trim();
    if (!pillar) {
      setError("Digite um nome para o pilar.");
      return;
    }
    if (
      pillars.some(
        (item) =>
          item.toLocaleLowerCase("pt-BR") ===
          pillar.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setError("Já existe um pilar com esse nome.");
      return;
    }
    onSubmit(pillar);
    setName("");
    setError("");
    handleOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Adicionar pilar</DialogTitle>
            <DialogDescription>
              Crie uma área de evolução. Depois, você poderá associar blocos de
              rotina a ela.
            </DialogDescription>
          </DialogHeader>
          <div className="py-5">
            <Field label="Nome do pilar">
              <Input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Ex.: Espiritualidade"
                required
              />
            </Field>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Adicionar pilar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FinanceGroupDialog({
  open,
  onOpenChange,
  groups,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: FinanceGroup[];
  onSubmit: (group: FinanceGroup) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<FinanceGroupColor>("blue");
  const [kind, setKind] = useState<FinanceGroup["kind"]>("expense");
  const [error, setError] = useState("");
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setColor("blue");
      setKind("expense");
      setError("");
    }
    onOpenChange(nextOpen);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const groupName = name.trim();
    if (!groupName) {
      setError("Digite um nome para o bloco.");
      return;
    }
    if (
      groups.some(
        (group) =>
          group.name.toLocaleLowerCase("pt-BR") ===
          groupName.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setError("Já existe um bloco com esse nome.");
      return;
    }
    onSubmit({
      id: `custom-finance-${Date.now()}`,
      name: groupName,
      color,
      kind,
    });
    setName("");
    setColor("blue");
    setKind("expense");
    setError("");
    handleOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Novo bloco financeiro</DialogTitle>
            <DialogDescription>
              Crie um agrupador de entrada ou saída com o nome e a cor que
              fizerem sentido para sua organização.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-5">
            <Field label="Nome do bloco">
              <Input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Ex.: Mercado Pago"
                required
              />
            </Field>
            {error && <p className="-mt-3 text-sm text-destructive">{error}</p>}
            <Field label="Tipo de bloco">
              <Select
                value={kind}
                onValueChange={(value) =>
                  setKind(value as FinanceGroup["kind"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Saída</SelectItem>
                  <SelectItem value="income">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="space-y-3">
              <Label>Cor da tag</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {financeGroupColors.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:bg-muted ${color === option.value ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""}`}
                    onClick={() => setColor(option.value)}
                    aria-pressed={color === option.value}
                  >
                    <span className={`size-3 rounded-full ${option.swatch}`} />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs text-muted-foreground">Prévia</p>
                <Badge variant="secondary" className={financeGroupTones[color]}>
                  {name.trim() || "Nome do bloco"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar bloco</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoutineDialog({
  open,
  onOpenChange,
  activity,
  pillars,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activity: Activity | null;
  pillars: string[];
  onSubmit: (activities: Activity[], newPillar?: string) => void;
}) {
  const timeParts = activity?.time.split(" — ") ?? [];
  const [selectedDays, setSelectedDays] = useState<number[]>([
    activity?.day ?? new Date().getDay(),
  ]);
  const [pillar, setPillar] = useState<Pillar>(
    activity?.pillar ??
      (pillars.includes("Projeto") ? "Projeto" : (pillars[0] ?? "")),
  );
  const [practice, setPractice] = useState(activity?.practice ?? false);
  const [creatingPillar, setCreatingPillar] = useState(pillars.length === 0);
  const [newPillar, setNewPillar] = useState("");
  const [daysError, setDaysError] = useState(false);
  const closePillarCreation = () => {
    setCreatingPillar(false);
    setNewPillar("");
  };
  const toggleDay = (day: number, checked: boolean) => {
    setSelectedDays((current) =>
      checked
        ? [...new Set([...current, day])]
        : current.filter((item) => item !== day),
    );
    if (checked) setDaysError(false);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedDays.length === 0) return setDaysError(true);
    const data = new FormData(event.currentTarget);
    const start = String(data.get("start"));
    const end = String(data.get("end"));
    const customPillar = creatingPillar ? newPillar.trim() : "";
    const matchingPillar = pillars.find(
      (item) =>
        item.toLocaleLowerCase("pt-BR") ===
        customPillar.toLocaleLowerCase("pt-BR"),
    );
    const effectivePillar = matchingPillar || customPillar || pillar;
    const orderedDays =
      activity && selectedDays.includes(activity.day)
        ? [
            activity.day,
            ...selectedDays
              .filter((day) => day !== activity.day)
              .sort((a, b) => a - b),
          ]
        : [...selectedDays].sort((a, b) => a - b);
    const stamp = Date.now();
    const activities = orderedDays.map((day, index) => ({
      id:
        index === 0 && activity
          ? activity.id
          : `custom-${stamp}-${day}-${index}`,
      title: String(data.get("title")),
      day,
      pillar: effectivePillar,
      time: `${start} — ${end}`,
      practice,
    }));
    onSubmit(
      activities,
      customPillar && !matchingPillar ? customPillar : undefined,
    );
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {activity ? "Editar bloco" : "Novo bloco de rotina"}
            </DialogTitle>
            <DialogDescription>
              {activity
                ? "Altere o bloco e escolha em quais dias ele deve aparecer."
                : "Cadastre uma vez e repita o bloco nos dias que fizerem sentido."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-5">
            <Field label="Nome do bloco">
              <Input
                name="title"
                defaultValue={activity?.title}
                required
                placeholder="Ex.: Leitura técnica"
              />
            </Field>
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {days.map((item, index) => (
                  <label
                    key={item}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${selectedDays.includes(index) ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <Checkbox
                      checked={selectedDays.includes(index)}
                      onCheckedChange={(checked) =>
                        toggleDay(index, checked === true)
                      }
                    />
                    <span>{item.replace("-feira", "")}</span>
                  </label>
                ))}
              </div>
              <p
                className={`text-xs ${daysError ? "text-destructive" : "text-muted-foreground"}`}
              >
                {daysError
                  ? "Selecione pelo menos um dia da semana."
                  : "Você pode selecionar quantos dias quiser para repetir este bloco."}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Field label="Pilar">
                    <Select value={pillar} onValueChange={setPillar}>
                      <SelectTrigger disabled={pillars.length === 0}>
                        <SelectValue placeholder="Crie um pilar" />
                      </SelectTrigger>
                      <SelectContent>
                        {pillars.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {pillars.length > 0 && (
                  <Button
                    type="button"
                    variant={creatingPillar ? "secondary" : "outline"}
                    onClick={() =>
                      creatingPillar
                        ? closePillarCreation()
                        : setCreatingPillar(true)
                    }
                  >
                    {creatingPillar ? <X /> : <Plus />}
                    {creatingPillar ? "Cancelar novo pilar" : "Novo pilar"}
                  </Button>
                )}
              </div>
              {creatingPillar && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        Criando um novo pilar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Preencha o nome ou feche para voltar ao pilar
                        selecionado.
                      </p>
                    </div>
                    {pillars.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={closePillarCreation}
                        aria-label="Fechar criação de novo pilar"
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                  <Field label="Nome do novo pilar">
                    <Input
                      autoFocus
                      value={newPillar}
                      onChange={(event) => setNewPillar(event.target.value)}
                      placeholder="Ex.: Espiritualidade"
                      required
                    />
                  </Field>
                  <p className="mt-2 text-xs text-muted-foreground">
                    O novo pilar será aplicado a este bloco e ficará disponível
                    nos próximos cadastros.
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Início">
                <Input
                  name="start"
                  type="time"
                  defaultValue={timeParts[0] ?? "09:00"}
                  required
                />
              </Field>
              <Field label="Término">
                <Input
                  name="end"
                  type="time"
                  defaultValue={timeParts[1] ?? "10:00"}
                  required
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={practice}
                onCheckedChange={(value) => setPractice(value === true)}
              />
              <span>
                <span className="block text-sm font-medium">
                  Exigir prática para concluir
                </span>
                <span className="block text-xs text-muted-foreground">
                  Útil para estudos e atividades de aprendizado.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {activity
                ? "Salvar alterações"
                : selectedDays.length > 1
                  ? `Adicionar em ${selectedDays.length} dias`
                  : "Adicionar bloco"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  preset,
  financeGroups,
  selectedMonth,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense: Expense | null;
  preset: ExpensePreset | null;
  financeGroups: FinanceGroup[];
  selectedMonth: string;
  onSubmit: (expenses: Expense[]) => void;
}) {
  const initialKind = expense?.kind ?? preset?.kind ?? "expense";
  const initialAccount =
    (expense
      ? getExpenseGroupName(expense)
      : preset?.account ??
        financeGroups.find((group) => group.kind === initialKind)?.name) ?? "";
  const [kind, setKind] = useState<Expense["kind"]>(initialKind);
  const [category, setCategory] = useState(
    expense?.category ?? (initialKind === "income" ? "Salário" : "Alimentação"),
  );
  const [method, setMethod] = useState(
    expense?.method ??
      (initialKind === "income"
        ? "PIX"
        : initialAccount === "Outras despesas"
          ? "PIX"
          : "Cartão de crédito"),
  );
  const [account, setAccount] = useState<ExpenseAccount>(initialAccount);
  const [installment, setInstallment] = useState(!!expense?.installmentsTotal);
  const [installmentCurrent, setInstallmentCurrent] = useState(
    expense?.installmentCurrent ?? 1,
  );
  const [installmentsTotal, setInstallmentsTotal] = useState(
    expense?.installmentsTotal ?? 2,
  );
  const changeKind = (value: string) => {
    const next = value as Expense["kind"];
    setKind(next);
    setAccount(
      financeGroups.find((group) => group.kind === next)?.name ?? "",
    );
    if (next === "income") {
      setCategory("Salário");
      setMethod("PIX");
      setInstallment(false);
    } else {
      setCategory("Alimentação");
      setMethod("Cartão de crédito");
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get("date"));
    const stamp = expense?.seriesId ?? Date.now();
    const current = Math.max(
      1,
      Math.min(installmentCurrent, installmentsTotal),
    );
    const total = Math.max(current, installmentsTotal);
    const base: Omit<Expense, "id" | "date"> = {
      description: String(data.get("description")),
      amount: Number(data.get("amount")),
      category,
      method,
      kind,
      account,
      card:
        kind === "expense" &&
        method === "Cartão de crédito" &&
        (account === "Nubank" || account === "Inter")
          ? account
          : undefined,
    };
    if (expense) {
      onSubmit([
        {
          ...base,
          id: expense.id,
          date,
          seriesId: expense.seriesId,
          installmentCurrent: installment ? current : undefined,
          installmentsTotal: installment ? total : undefined,
        },
      ]);
    } else if (kind === "expense" && installment) {
      onSubmit(
        Array.from({ length: total - current + 1 }, (_, offset) => ({
          ...base,
          id: stamp + offset,
          date: shiftISODateMonth(date, offset),
          seriesId: stamp,
          installmentCurrent: current + offset,
          installmentsTotal: total,
        })),
      );
    } else {
      onSubmit([{ ...base, id: stamp, date }]);
    }
    onOpenChange(false);
  };
  const availableCategories =
    kind === "income" ? incomeCategories : expenseCategories;
  const availableMethods = kind === "income" ? incomeMethods : expenseMethods;
  const availableFinanceGroups = financeGroups.filter(
    (group) => group.kind === kind,
  );
  const defaultDate =
    expense?.date ??
    (selectedMonth === currentMonthKey()
      ? toLocalISO(new Date())
      : `${selectedMonth}-01`);
  const remaining = Math.max(1, installmentsTotal - installmentCurrent + 1);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {expense
                ? "Editar movimentação"
                : kind === "income"
                  ? "Nova entrada"
                  : "Nova despesa"}
            </DialogTitle>
            <DialogDescription>
              {expense
                ? "Atualize este lançamento. Em compras parceladas, a edição altera somente esta parcela."
                : preset
                  ? `Este lançamento será registrado como ${kind === "income" ? "entrada" : "saída"} em ${account}.`
                  : "Cadastre uma entrada, despesa ou compra parcelada para planejar os próximos meses."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Tipo">
              <Select
                value={kind}
                onValueChange={changeKind}
                disabled={!!preset}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Descrição">
              <Input
                name="description"
                defaultValue={expense?.description}
                placeholder={
                  kind === "income"
                    ? "Ex.: Salário ou alimentação"
                    : "Ex.: Dentista ou internet"
                }
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={installment ? "Valor da parcela" : "Valor"}>
                <Input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={expense?.amount}
                  placeholder="0,00"
                  required
                />
              </Field>
              <Field label={installment ? "Primeiro vencimento" : "Data"}>
                <Input
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Categoria">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={kind === "income" ? "Recebimento" : "Pagamento"}>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMethods.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={kind === "income" ? "Grupo da entrada" : "Grupo da despesa"}>
              <Select
                value={account}
                onValueChange={(value) => setAccount(value as ExpenseAccount)}
                disabled={availableFinanceGroups.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Crie um bloco deste tipo" />
                </SelectTrigger>
                <SelectContent>
                  {availableFinanceGroups.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {availableFinanceGroups.length === 0 && (
              <p className="-mt-2 text-sm text-destructive">
                Crie primeiro um bloco de {kind === "income" ? "entrada" : "saída"} em Lançamentos.
              </p>
            )}
            {kind === "expense" && (
              <>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={installment}
                    onCheckedChange={(value) => setInstallment(value === true)}
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Compra parcelada
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Cria automaticamente os lançamentos nos próximos meses.
                    </span>
                  </span>
                </label>
                {installment && (
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Parcela atual">
                        <Input
                          type="number"
                          min="1"
                          max={installmentsTotal}
                          value={installmentCurrent}
                          onChange={(event) =>
                            setInstallmentCurrent(Number(event.target.value))
                          }
                          required
                        />
                      </Field>
                      <Field label="Total de parcelas">
                        <Input
                          type="number"
                          min={installmentCurrent}
                          max="120"
                          value={installmentsTotal}
                          onChange={(event) =>
                            setInstallmentsTotal(Number(event.target.value))
                          }
                          required
                        />
                      </Field>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {expense
                        ? "Esta edição afeta apenas a parcela selecionada."
                        : `${remaining} lançamentos serão criados, da parcela ${installmentCurrent}/${installmentsTotal} até ${installmentsTotal}/${installmentsTotal}.`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={availableFinanceGroups.length === 0}>
              {expense
                ? "Salvar alterações"
                : installment
                  ? `Criar ${remaining} parcelas`
                  : "Salvar movimentação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IdeaDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (i: Idea) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      id: Date.now(),
      title: String(data.get("title")),
      description: String(data.get("description")),
      status: "Caixa de entrada",
    });
    event.currentTarget.reset();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Capturar ideia</DialogTitle>
            <DialogDescription>
              Registre o suficiente para lembrar por que ela importa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Título">
              <Input name="title" required placeholder="Nome curto da ideia" />
            </Field>
            <Field label="Descrição">
              <Textarea
                name="description"
                required
                placeholder="Contexto, problema ou oportunidade..."
                rows={5}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar ideia</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IdeaDetailDialog({
  idea,
  onOpenChange,
  onSave,
  onDelete,
}: {
  idea: Idea;
  onOpenChange: (open: boolean) => void;
  onSave: (idea: Idea) => void;
  onDelete: (id: number) => void;
}) {
  const [status, setStatus] = useState<Idea["status"]>(idea.status);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      ...idea,
      title: String(data.get("title")),
      description: String(data.get("description")),
      status,
    });
  };
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Detalhes da ideia</DialogTitle>
            <DialogDescription>
              Revise, edite ou altere o estágio desta ideia.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Field label="Título">
              <Input name="title" defaultValue={idea.title} required />
            </Field>
            <Field label="Descrição">
              <Textarea
                name="description"
                defaultValue={idea.description}
                rows={6}
                required
              />
            </Field>
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as Idea["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caixa de entrada">
                    Caixa de entrada
                  </SelectItem>
                  <SelectItem value="Explorando">Explorando</SelectItem>
                  <SelectItem value="Priorizada">Priorizada</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter className="sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                  Excluir ideia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta ideia?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é permanente e não poderá ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(idea.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button type="submit">Salvar alterações</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NoteDialog({
  open,
  onOpenChange,
  note,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  note: ProjectNote | null;
  onSubmit: (n: string) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit(String(data.get("note")));
    event.currentTarget.reset();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {note ? "Editar avanço" : "Registrar avanço"}
            </DialogTitle>
            <DialogDescription>
              {note
                ? "Atualize este registro da linha do tempo."
                : "Descreva uma evidência concreta de progresso."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-5">
            <Field label="O que avançou?">
              <Textarea
                name="note"
                required
                rows={5}
                defaultValue={note?.text}
                placeholder="Ex.: Validei o fluxo principal com..."
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {note ? "Salvar alterações" : "Adicionar ao histórico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PracticeDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: PracticeTarget | null;
  onClose: () => void;
  onConfirm: (practiceNote: string) => void;
}) {
  const [practiceNote, setPracticeNote] = useState("");

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirme a prática</DialogTitle>
          <DialogDescription>
            Para concluir atividades de aprendizado, registre também uma
            aplicação prática.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="font-medium">{target?.activity.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Exemplo: exercício, protótipo, conversa, teste ou entrega concreta.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="practice-note">O que você praticou?</Label>
          <Textarea
            id="practice-note"
            placeholder="Descreva em uma frase..."
            value={practiceNote}
            onChange={(event) => setPracticeNote(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(practiceNote)}
            disabled={!practiceNote.trim()}
          >
            <Check />
            Confirmar prática
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof Target;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          <Plus />
          {action}
        </Button>
      )}
    </div>
  );
}

function DeleteAction({
  label,
  description,
  onConfirm,
}: {
  label: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          aria-label={label}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
