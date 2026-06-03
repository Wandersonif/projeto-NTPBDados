import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Plus, 
  Filter, 
  Search, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  LogOut,
  Bell,
  Settings,
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
import { Bar, Line } from 'react-chartjs-2';
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      notify('Erro ao carregar produtos.', 'error');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar categorias.');
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`);
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      notify('Erro ao carregar métricas.', 'error');
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchDashboard()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchProducts, fetchCategories, fetchDashboard]);

  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = {
      nome: formData.get('nome'),
      preco: Number(formData.get('preco')),
      estoque: Number(formData.get('estoque')),
      categoria_id: Number(formData.get('categoria_id'))
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setShowModal(false);
      await Promise.all([fetchProducts(), fetchDashboard()]);
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleProcessSale = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const saleData = {
      productId: Number(formData.get('productId')),
      quantity: Number(formData.get('quantity'))
    };

    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      await Promise.all([fetchProducts(), fetchDashboard()]);
      setActiveTab('dashboard');
    } catch (err: any) {
      notify(err.message, 'error');
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

  const lineData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    datasets: [{
      label: 'Vendas',
      data: [31, 40, 28, 51, 42, 109, 100],
      fill: true,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      pointRadius: 4,
    }]
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner" size={48} />
        <p>Sincronizando com PostgreSQL...</p>
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
          <div className="nav-divider" />
          <NavItem icon={<Users size={20} />} label="Equipe" expanded={isSidebarOpen} />
          <NavItem icon={<Settings size={20} />} label="Configurações" expanded={isSidebarOpen} />
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar">W</div>
            {isSidebarOpen && <div className="user-info"><p className="name">Wanderson</p><p className="role">Admin Project</p></div>}
            {isSidebarOpen && <LogOut size={16} className="logout-icon" />}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}><MoreVertical size={20} /></button>
            <div className="search-bar"><Search size={18} /><input type="text" placeholder="Consultar banco..." /></div>
          </div>
          <div className="header-right">
            <button className="icon-btn"><Calendar size={20} /></button>
            <button className="icon-btn notification"><Bell size={20} /><span></span></button>
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
                    {ranking.map((p: any, i: number) => (
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
              <div><h1>Inventário Central</h1><p>Conectado ao PostgreSQL 16.</p></div>
              <button className="btn-primary-new" onClick={() => setShowModal(true)}><Plus size={18} /> Adicionar Produto</button>
            </div>
            
            <div className="inventory-grid-v2">
              <div className="table-card full-width">
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
                  <tbody>
                    {products.map(p => (
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
                        <td><button className="icon-btn"><Settings size={16} /></button></td>
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
                             {products.map(p => (
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

const chartOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { borderDash: [5, 5] } }
  }
};

function NavItem({ icon, label, active, onClick, expanded }: any) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}{expanded && <span>{label}</span>}{active && expanded && <div className="active-indicator" />}
    </button>
  );
}

function MetricCard({ title, value, trend, up, icon }: any) {
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
