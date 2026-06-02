import { useState, useMemo } from 'react';
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
  AlertCircle
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

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Smartphone Galaxy S24', cat: 'Eletrônicos', price: 4500, sales: 124, stock: 15, status: 'Em Alta' },
  { id: 2, name: 'MacBook Air M2', cat: 'Eletrônicos', price: 8200, sales: 89, stock: 8, status: 'Estável' },
  { id: 3, name: 'Fone Sony XM5', cat: 'Acessórios', price: 2100, sales: 64, stock: 22, status: 'Em Alta' },
  { id: 4, name: 'Monitor Gamer 27"', cat: 'Periféricos', price: 1800, sales: 45, stock: 12, status: 'Estável' },
  { id: 5, name: 'Teclado Mecânico RGB', cat: 'Periféricos', price: 450, sales: 110, stock: 30, status: 'Em Alta' },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(124592);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddProduct = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProd = {
      id: products.length + 1,
      name: formData.get('name') as string,
      cat: formData.get('cat') as string,
      price: Number(formData.get('price')),
      sales: 0,
      stock: Number(formData.get('stock')),
      status: 'Novo'
    };
    setProducts([newProd, ...products]);
    setShowModal(false);
    notify('Produto cadastrado com sucesso!');
  };

  // LÓGICA DE VENDA COM ABATIMENTO DE ESTOQUE
  const handleProcessSale = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productId = Number(formData.get('productId'));
    const quantity = Number(formData.get('quantity'));

    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const product = products[productIndex];

    if (product.stock < quantity) {
      notify(`Estoque insuficiente! Apenas ${product.stock} unidades disponíveis.`, 'error');
      return;
    }

    // Atualiza o estado dos produtos (Imutabilidade)
    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...product,
      stock: product.stock - quantity,
      sales: product.sales + quantity
    };

    setProducts(updatedProducts);
    setTotalRevenue(prev => prev + (product.price * quantity));
    notify(`Venda concluída! ${quantity}x ${product.name} abatidos do estoque.`);
    setActiveTab('dashboard');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { grid: { borderDash: [5, 5], color: '#e2e8f0' }, ticks: { color: '#64748b' } }
    }
  };

  const barData = {
    labels: [...new Set(products.map(p => p.cat))],
    datasets: [{
      data: [...new Set(products.map(p => p.cat))].map(cat => 
        products.filter(p => p.cat === cat).reduce((sum, p) => sum + (p.price * p.sales), 0)
      ),
      backgroundColor: '#6366f1',
      borderRadius: 6,
      barThickness: 32,
    }]
  };

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
            <div className="search-bar"><Search size={18} /><input type="text" placeholder="Buscar em tempo real..." /></div>
          </div>
          <div className="header-right">
            <button className="icon-btn"><Calendar size={20} /></button>
            <button className="icon-btn notification"><Bell size={20} /><span></span></button>
            <button className="btn-primary-new" onClick={() => setActiveTab('vendas')}>
              <Plus size={18} /><span>Nova Venda</span>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="view-container fade-in">
            <div className="view-header">
              <div><h1>Visão Geral</h1><p>Status atual do seu e-commerce fictício.</p></div>
              <div className="date-picker-sim"><Filter size={16} /><span>Relatório Semanal</span></div>
            </div>

            <div className="metrics-row">
              <MetricCard title="Receita Total" value={`R$ ${totalRevenue.toLocaleString()}`} trend="+12.5%" up={true} icon={<TrendingUp color="#6366f1" />} />
              <MetricCard title="Vendas" value={products.reduce((acc, p) => acc + p.sales, 0)} trend="+8.2%" up={true} icon={<ShoppingCart color="#10b981" />} />
              <MetricCard title="Produtos" value={products.length} trend="+3" up={true} icon={<Package color="#f59e0b" />} />
              <MetricCard title="Ticket Médio" value={`R$ ${(totalRevenue / products.reduce((acc, p) => acc + (p.sales || 1), 0)).toFixed(0)}`} trend="+4.1%" up={true} icon={<TrendingUp color="#8b5cf6" />} />
            </div>

            <div className="dashboard-grid-new">
              <div className="chart-card main-chart">
                <div className="card-head"><h3>Performance de Vendas</h3></div>
                <div className="chart-wrapper"><Line data={lineData} options={chartOptions} /></div>
              </div>
              <div className="chart-card side-chart">
                <div className="card-head"><h3>Vendas p/ Categoria</h3></div>
                <div className="chart-wrapper"><Bar data={barData} options={chartOptions} /></div>
              </div>
              <div className="table-card full-width">
                <div className="card-head"><h3>Ranking de Performance</h3></div>
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Categoria</th><th>Vendas Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {products.sort((a,b) => b.sales - a.sales).slice(0, 4).map(p => (
                      <ProductRow key={p.id} name={p.name} cat={p.cat} sales={p.sales} status={p.status} />
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
              <div><h1>Inventário Central</h1><p>Gestão de {products.length} produtos em estoque.</p></div>
              <button className="btn-primary-new" onClick={() => setShowModal(true)}><Plus size={18} /> Adicionar Produto</button>
            </div>
            
            <div className="inventory-grid-v2">
              <div className="table-card full-width">
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td><div className="product-cell"><div className="product-img">{p.name[0]}</div><span>{p.name}</span></div></td>
                        <td><span className="badge-cat">{p.cat}</span></td>
                        <td>R$ {p.price.toLocaleString()}</td>
                        <td>
                          <div className="stock-indicator">
                            <div className="stock-bar"><div className="fill" style={{ width: `${Math.min(p.stock * 5, 100)}%`, backgroundColor: p.stock < 5 ? '#ef4444' : p.stock < 10 ? '#f59e0b' : '#10b981' }}></div></div>
                            <span style={{ color: p.stock < 5 ? '#ef4444' : 'inherit', fontWeight: p.stock < 5 ? 'bold' : 'normal' }}>{p.stock} un</span>
                          </div>
                        </td>
                        <td><button className="icon-btn" onClick={() => notify('Abrindo edição de ' + p.name)}><Settings size={16} /></button></td>
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
              <div className="view-header">
                <div><h1>Terminal de Vendas</h1><p>Realize vendas e abata o estoque em tempo real.</p></div>
              </div>
              <div className="sales-terminal">
                 <div className="form-card">
                    <h3>Registrar Pedido</h3>
                    <form className="modern-form" onSubmit={handleProcessSale}>
                       <div className="field">
                          <label>Selecionar Produto</label>
                          <select name="productId" required>
                             {products.map(p => (
                               <option key={p.id} value={p.id} disabled={p.stock === 0}>
                                 {p.name} ({p.stock} em estoque) - R$ {p.price.toLocaleString()}
                               </option>
                             ))}
                          </select>
                       </div>
                       <div className="field">
                          <label>Quantidade</label>
                          <input name="quantity" type="number" defaultValue="1" min="1" required />
                       </div>
                       <div className="sale-info">
                         <AlertCircle size={14} />
                         <span>A venda irá atualizar o estoque e a receita no Dashboard.</span>
                       </div>
                       <button type="submit" className="btn-primary-new full">Concluir Transação</button>
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
                <label>Nome do Item</label>
                <input name="name" required placeholder="Ex: Câmera Mirrorless" />
              </div>
              <div className="row">
                <div className="field">
                  <label>Categoria</label>
                  <select name="cat">
                    <option>Eletrônicos</option>
                    <option>Periféricos</option>
                    <option>Acessórios</option>
                  </select>
                </div>
                <div className="field">
                  <label>Preço (R$)</label>
                  <input name="price" type="number" required placeholder="0.00" />
                </div>
              </div>
              <div className="field">
                <label>Estoque Inicial</label>
                <input name="stock" type="number" required placeholder="Qtd" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-new">Salvar no Sistema</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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

function ProductRow({ name, cat, sales, status }: any) {
  return (
    <tr>
      <td><div className="product-cell"><div className="product-img">{name[0]}</div><span>{name}</span></div></td>
      <td><span className="badge-cat">{cat}</span></td>
      <td>{sales}</td>
      <td><span className={`status-pill ${status === 'Em Alta' ? 'high' : 'stable'}`}>{status}</span></td>
    </tr>
  );
}

export default App;
