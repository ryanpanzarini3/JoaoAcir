import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Clientes from './pages/Clientes';
import Comandas from './pages/Comandas';
import Comanda from './pages/Comanda';
import Relatorios from './pages/Relatorios';
import Produtos from './pages/Produtos';
import Fiado from './pages/Fiado';
import Estoque from './pages/Estoque';
import Login from './pages/Login';
import api from './api';
import './App.css';

function useRelogio() {
  const [hora, setHora] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const data = now.toLocaleDateString('pt-BR');
      const h = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setHora(`${data} ${h}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return hora;
}

function Navbar({ onLogout }) {
  const hora = useRelogio();
  const [stats, setStats] = useState({ faturamentoHoje: 0, comandasAtivas: 0 });

  useEffect(() => {
    async function load() {
      try { const { data } = await api.get('/relatorios/stats-hoje'); setStats(data); } catch {}
    }
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-logo">
          <span className="bar-do">Bar do</span>
          <span className="bar-nome">João Acir</span>
          <span className="painel-label">Painel Operacional</span>
        </div>
        <div className="navbar-stats">
          <div className="stat-item">Faturamento Hoje: <strong>{fmt(stats.faturamentoHoje)}</strong></div>
          <div className="stat-item">Comandas Ativas: <strong>{stats.comandasAtivas}</strong></div>
          <div className="stat-item"><strong>{hora}</strong></div>
          <div className="stat-item">
            <button className="btn-sair" onClick={onLogout} title="Sair">🔒 Sair</button>
          </div>
        </div>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end>Comandas</NavLink>
        <NavLink to="/clientes">Clientes</NavLink>
        <NavLink to="/fiado">Fiado</NavLink>
        <NavLink to="/relatorios">Relatórios</NavLink>
        <NavLink to="/produtos">Cardápio</NavLink>
        <NavLink to="/estoque">Estoque</NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  const [logado, setLogado] = useState(() => sessionStorage.getItem('bar-logado') === '1');

  function handleLogin() {
    sessionStorage.setItem('bar-logado', '1');
    setLogado(true);
  }

  function handleLogout() {
    sessionStorage.removeItem('bar-logado');
    setLogado(false);
  }

  if (!logado) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Navbar onLogout={handleLogout} />
      <main className="container">
        <Routes>
          <Route path="/" element={<Comandas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/comanda/:id" element={<Comanda />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/fiado" element={<Fiado />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/estoque" element={<Estoque />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
