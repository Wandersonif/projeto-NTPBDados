import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Filter, 
  Search, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

const API_URL = 'http://localhost:3001/api';

type AuthUser = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
};

type Product = {
  id: number;
  nome: string;
  preco: number | string;
  estoque: number;
  categoria_id: number | null;
  categoria_nome?: string | null;
  status: string;
  sales: number;
};

type Category = {
  id: number;
  nome: string;
  descricao?: string | null;
};

type DashboardMetrics = {
  receita_total: number | string;
  total_vendas: number | string;
  total_produtos: number | string;
  ticket_medio: number | string;
};

type RankingItem = Pick<Product, 'nome' | 'preco' | 'estoque' | 'status' | 'sales'> & {
  cat: string;
};

type DashboardData = {
  metrics: DashboardMetrics;
  ranking: RankingItem[];
};

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('ntpb_token'));
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const apiFetch = useCallback((path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
    if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

    return fetch(`${API_URL}${path}`, { ...options, headers });
  }, [authToken]);

  const fetchProducts = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await apiFetch('/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      notify('Erro ao carregar produtos.', 'error');
    }
  }, [apiFetch, authToken]);

  const fetchCategories = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await apiFetch('/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      console.error('Erro ao carregar categorias.');
    }
  }, [apiFetch, authToken]);

  const fetchDashboard = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await apiFetch('/dashboard/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDashboardData(data);
    } catch {
      notify('Erro ao carregar métricas.', 'error');
    }
  }, [apiFetch, authToken]);

  useEffect(() => {
    const loadAll = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const authRes = await apiFetch('/auth/me');
        const authData = await authRes.json();

        if (!authRes.ok) throw new Error(authData.error);

        setAuthUser(authData.user);
        await Promise.all([fetchProducts(), fetchCategories(), fetchDashboard()]);
      } catch {
        localStorage.removeItem('ntpb_token');
        setAuthToken(null);
        setAuthUser(null);
        notify('Sessão expirada. Faça login novamente.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [apiFetch, authToken, fetchProducts, fetchCategories, fetchDashboard]);

  const persistSession = (token: string, user: AuthUser) => {
    localStorage.setItem('ntpb_token', token);
    setAuthToken(token);
    setAuthUser(user);
  };

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const res = await fetch(`${API_URL}/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'login' ? { email: payload.email, password: payload.password } : payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      persistSession(data.token, data.user);
      notify(authMode === 'login' ? 'Login realizado com sucesso.' : 'Usuário cadastrado com sucesso.');
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Erro ao autenticar usuário.'), 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ntpb_token');
    setAuthToken(null);
    setAuthUser(null);
    setProducts([]);
    setCategories([]);
    setDashboardData(null);
    setActiveTab('dashboard');
  };

  const handleAddProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct = {
      nome: formData.get('nome'),
      preco: Number(formData.get('preco')),
      estoque: Number(formData.get('estoque')),
      categoria_id: Number(formData.get('categoria_id'))
    };

    try {
      const res = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setShowModal(false);
      await Promise.all([fetchProducts(), fetchDashboard()]);
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Erro ao cadastrar produto.'), 'error');
    }
  };

  const handleProcessSale = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const saleData = {
      productId: Number(formData.get('productId')),
      quantity: Number(formData.get('quantity'))
    };

    try {
      const res = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify(saleData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      await Promise.all([fetchProducts(), fetchDashboard()]);
      setActiveTab('dashboard');
    } catch (err: unknown) {
      notify(getErrorMessage(err, 'Erro ao registrar venda.'), 'error');
    }
  };

  const barData = useMemo(() => {
    if (!products.length) return null;
    const cats = [...new Set(products.map(p => p.categoria_nome || 'Sem Categoria'))];
    return {
      labels: cats,
      datasets: [{
        data: cats.map(cat => 
          products.filter(p => p.categoria_nome === cat).reduce((sum, p) => sum + (Number(p.preco) * Number(p.sales || 0)), 0)
        ),
        backgroundColor: '#6366f1',
        borderRadius: 6,
        barThickness: 32,
      }]
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;

    return products.filter(product => {
      const category = product.categoria_nome || 'Geral';
      return `${product.nome} ${category} ${product.status}`.toLowerCase().includes(search);
    });
  }, [productSearch, products]);

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner" size={48} />
        <p>Sincronizando com PostgreSQL...</p>
      </div>
    );
  }

  if (!authToken || !authUser) {
    return (
      <div className="auth-layout">
        {notification && (
          <div className={`toast-notification fade-in ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {notification.msg}
          </div>
        )}

        <section className="auth-panel">
          <div className="auth-brand">
            <div className="brand-icon">N</div>
            <div>
              <h1>NTPBDados</h1>
              <p>Área de controle de vendas</p>
            </div>
          </div>

          <div className="auth-tabs" role="tablist">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Entrar</button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Cadastrar</button>
          </div>

          <form className="modern-form auth-form" onSubmit={handleAuth}>
            {authMode === 'register' && (
              <div className="field">
                <label>Nome</label>
                <input name="nome" required placeholder="Seu nome" />
              </div>
            )}
            <div className="field">
              <label>E-mail</label>
              <input name="email" type="email" required placeholder="admin@ntpbdados.com" />
            </div>
            <div className="field">
              <label>Senha</label>
              <input name="password" type="password" minLength={6} required placeholder="Mínimo 6 caracteres" />
            </div>
            <button type="submit" className="btn-primary-new full">
              {authMode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || { receita_total: 0, total_vendas: 0, total_produtos: 0, ticket_medio: 0 };
  const ranking = dashboardData?.ranking || [];

  return (
    <div className="admin-layout">
      {notification && (
        <div className={`toast-notification fade-in ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {notification.msg}
        </div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand">
          <div className="brand-icon">N</div>
          {isSidebarOpen && <span className="brand-name">NTPB<span>Dados</span></span>}
        </div>

        <nav className="side-nav">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={isSidebarOpen} />
          <NavItem active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} icon={<Package size={20} />} label="Produtos" expanded={isSidebarOpen} />
          <NavItem active={activeTab === 'vendas'} onClick={() => setActiveTab('vendas')} icon={<ShoppingCart size={20} />} label="Vendas" expanded={isSidebarOpen} />
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar">{authUser.nome[0]?.toUpperCase()}</div>
            {isSidebarOpen && <div className="user-info"><p className="name">{authUser.nome}</p><p className="role">{authUser.perfil}</p></div>}
            {isSidebarOpen && <button className="logout-button" onClick={handleLogout} title="Sair"><LogOut size={16} /></button>}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}><MoreVertical size={20} /></button>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="search"
                placeholder="Buscar produtos..."
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="header-right">
            <button className="btn-primary-new" onClick={() => { setActiveTab('produtos'); setShowModal(true); }}>
              <Plus size={18} /><span>Novo Produto</span>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="view-container fade-in">
            <div className="view-header">
              <div><h1>Visão Geral</h1><p>Dados reais recuperados do PostgreSQL.</p></div>
              <div className="date-picker-sim"><Filter size={16} /><span>Base Ativa</span></div>
            </div>

            <div className="metrics-row">
              <MetricCard title="Receita Total" value={`R$ ${Number(metrics.receita_total).toLocaleString()}`} trend="+Real-time" up={true} icon={<TrendingUp color="#6366f1" />} />
              <MetricCard title="Vendas" value={metrics.total_vendas} trend="Histórico" up={true} icon={<ShoppingCart color="#10b981" />} />
              <MetricCard title="Produtos" value={metrics.total_produtos} trend="Ativos" up={true} icon={<Package color="#f59e0b" />} />
              <MetricCard title="Ticket Médio" value={`R$ ${Number(metrics.ticket_medio).toFixed(0)}`} trend="Médio" up={true} icon={<TrendingUp color="#8b5cf6" />} />
            </div>

            <div className="dashboard-grid-new">
              <div className="chart-card main-chart">
                <div className="card-head"><h3>Vendas por Categoria</h3></div>
                <div className="chart-wrapper">{barData && <Bar data={barData} options={{...chartOptions, maintainAspectRatio: false}} />}</div>
              </div>
              <div className="table-card side-list">
                <div className="card-head"><h3>Top Ranking (Sales)</h3></div>
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Vendas</th></tr></thead>
                  <tbody>
                    {ranking.map((p, i) => (
                      <tr key={i}>
                        <td><div className="product-cell"><span>{p.nome}</span></div></td>
                        <td><span className="status-pill high">{p.sales}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'produtos' && (
          <div className="view-container fade-in">
            <div className="view-header">
              <div><h1>Inventário Central</h1><p>{filteredProducts.length} produto(s) encontrado(s).</p></div>
              <button className="btn-primary-new" onClick={() => setShowModal(true)}><Plus size={18} /> Adicionar Produto</button>
            </div>
            
            <div className="inventory-grid-v2">
              <div className="table-card full-width">
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th></tr></thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td><div className="product-cell"><div className="product-img">{p.nome[0]}</div><span>{p.nome}</span></div></td>
                        <td><span className="badge-cat">{p.categoria_nome || 'Geral'}</span></td>
                        <td>R$ {Number(p.preco).toLocaleString()}</td>
                        <td>
                          <div className="stock-indicator">
                            <div className="stock-bar"><div className="fill" style={{ width: `${Math.min(p.estoque * 5, 100)}%`, backgroundColor: p.estoque < 5 ? '#ef4444' : '#10b981' }}></div></div>
                            <span>{p.estoque} un</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendas' && (
           <div className="view-container fade-in">
              <div className="view-header"><h1>Terminal de Vendas</h1></div>
              <div className="sales-terminal">
                 <div className="form-card">
                    <h3>Registrar Pedido</h3>
                    <form className="modern-form" onSubmit={handleProcessSale}>
                       <div className="field">
                          <label>Produto (Postgres)</label>
                          <select name="productId" required>
                             {filteredProducts.map(p => (
                               <option key={p.id} value={p.id} disabled={p.estoque === 0}>
                                 {p.nome} ({p.estoque} un)
                               </option>
                             ))}
                          </select>
                       </div>
                       <div className="field">
                          <label>Quantidade</label>
                          <input name="quantity" type="number" defaultValue="1" min="1" required />
                       </div>
                       <button type="submit" className="btn-primary-new full">Confirmar e Abater Estoque</button>
                    </form>
                 </div>
              </div>
           </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content scale-up">
            <div className="modal-header">
              <h2>Novo Produto</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="modern-form">
              <div className="field">
                <label>Nome do Produto</label>
                <input name="nome" required placeholder="Ex: Câmera Mirrorless" />
              </div>
              <div className="row">
                <div className="field">
                  <label>Categoria</label>
                  <select name="categoria_id" required>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Preço (R$)</label>
                  <input name="preco" type="number" step="0.01" required placeholder="0.00" />
                </div>
              </div>
              <div className="field">
                <label>Estoque Inicial</label>
                <input name="estoque" type="number" required placeholder="Qtd" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-new">Salvar no PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const chartOptions: ChartOptions<'bar'> = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { display: true } }
  }
};

type NavItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  expanded: boolean;
};

function NavItem({ icon, label, active = false, onClick, expanded }: NavItemProps) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}{expanded && <span>{label}</span>}{active && expanded && <div className="active-indicator" />}
    </button>
  );
}

type MetricCardProps = {
  title: string;
  value: ReactNode;
  trend: string;
  up: boolean;
  icon: ReactNode;
};

function MetricCard({ title, value, trend, up, icon }: MetricCardProps) {
  return (
    <div className="metric-card-new">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <p className="metric-title">{title}</p>
        <h2 className="metric-value">{value}</h2>
        <div className={`metric-trend ${up ? 'up' : 'down'}`}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

export default App;
