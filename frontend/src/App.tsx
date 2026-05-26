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
  LineElement
);

const barData = {
  labels: ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros', 'Casa'],
  datasets: [
    {
      label: 'Vendas por Categoria (R$)',
      data: [12000, 19000, 3000, 5000, 2000],
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    },
  ],
};

const lineData = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Evolução de Vendas (R$)',
      data: [10000, 15000, 8000, 22000, 18000, 25000],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    },
  ],
};

function App() {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard de Vendas - NTPBDados</h1>
        <p>Protótipo Visual Estático</p>
      </header>

      <main className="dashboard-grid">
        <div className="card">
          <h3>Vendas por Categoria</h3>
          <Bar data={barData} options={{ responsive: true }} />
        </div>

        <div className="card">
          <h3>Evolução Mensal</h3>
          <Line data={lineData} options={{ responsive: true }} />
        </div>

        <div className="card stats-card">
          <h3>Estatísticas Rápidas</h3>
          <ul>
            <li><strong>Total de Vendas:</strong> R$ 98.000,00</li>
            <li><strong>Ticket Médio:</strong> R$ 450,00</li>
            <li><strong>Produto Top:</strong> Smartphone X</li>
          </ul>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>Equipe: Wanderson, Gabriel, Rafael, Elias, Alessandra</p>
      </footer>
    </div>
  );
}

export default App;
