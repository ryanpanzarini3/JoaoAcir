import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tempoAberta(dataAbertura) {
  const date = parseDate(dataAbertura);
  if (!date) return '—';
  const diff = Math.floor((Date.now() - date) / 60000);
  if (diff < 60) return diff + 'min';
  const h = Math.floor(diff / 60), m = diff % 60;
  return h + 'h' + (m > 0 ? m + 'm' : '');
}

function LocalBadge({ local }) {
  const isMesa = local && local.toLowerCase().startsWith('mesa');
  return (
    <span className={'local-badge ' + (isMesa ? 'local-mesa' : 'local-balcao')}>
      {local || 'Balcao'}
    </span>
  );
}

export default function Comandas() {
  const [comandas, setComandas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [local, setLocal] = useState('Balcao');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { carregar(); }, []);
  useEffect(() => {
    const id = setInterval(() => carregar(), 30000);
    return () => clearInterval(id);
  }, []);

  async function carregar() {
    const { data } = await api.get('/comandas?status=aberta');
    setComandas(data);
  }

  async function buscarCliente() {
    if (!busca.trim()) return;
    const { data } = await api.get('/clientes?busca=' + encodeURIComponent(busca));
    setClientes(data);
    setClienteSelecionado(null);
  }

  async function abrirComanda() {
    if (!clienteSelecionado) return;
    setLoading(true);
    try {
      const { data } = await api.post('/comandas', { clienteId: clienteSelecionado.id, local });
      setShowModal(false);
      setBusca(''); setClientes([]); setClienteSelecionado(null); setLocal('Balcao');
      navigate('/comanda/' + data.id);
    } finally { setLoading(false); }
  }

  const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const comandasFiltradas = filtro.trim()
    ? comandas.filter(c =>
        c.cliente?.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
        String(c.id).includes(filtro.trim())
      )
    : comandas;

  const locaisOpcoes = ['Balcao', 'Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05',
    'Mesa 06', 'Mesa 07', 'Mesa 08', 'Mesa 09', 'Mesa 10'];

  return (
    <div>
      {/* ACESSO RAPIDO */}
      <div className="acesso-rapido">
        <h2>Acesso Rapido (Atendimento)</h2>
        <div className="acesso-form">
          <input
            placeholder="Digite Nome, Telefone (42) 99123-... ou CPF do cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') buscarCliente(); }}
          />
          <button className="btn btn-secondary" onClick={buscarCliente}>Buscar Cliente</button>
          <button className="btn btn-dark" onClick={() => navigate('/clientes')}>+ Cadastrar Novo Cliente</button>
        </div>
        {clientes.length > 0 && (
          <div className="busca-resultados">
            {clientes.map(c => (
              <div key={c.id} className="busca-item"
                onClick={() => { setClienteSelecionado(c); setBusca(''); setClientes([]); setShowModal(true); }}
              >
                <strong>{c.nome}</strong> — {c.telefone}
                {c.cpf ? ' | CPF: ' + c.cpf : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMANDAS ATIVAS */}
      <div className="secao-comandas">
        <div className="secao-title">
          Comandas Ativas no Momento
          <span className="badge-count">Total: {comandas.length}</span>
        </div>
        {comandas.length > 0 && (
          <div className="filtro-comandas">
            <input
              className="filtro-comandas-input"
              placeholder="🔍 Buscar por nome ou número da comanda..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
            {filtro && (
              <button className="btn btn-outline btn-sm" onClick={() => setFiltro('')}>✕ Limpar</button>
            )}
          </div>
        )}
        {comandas.length === 0 ? (
          <div className="card"><p className="empty">Nenhuma comanda aberta no momento.</p></div>
        ) : comandasFiltradas.length === 0 ? (
          <div className="card"><p className="empty">Nenhuma comanda encontrada para "{filtro}".</p></div>
        ) : (
          <div className="comandas-grid">
            {comandasFiltradas.map(c => (
              <div key={c.id} className="comanda-card comanda-card-clicavel" onClick={() => navigate('/comanda/' + c.id)}>
                <div className="comanda-card-header">
                  <span>
                    <span className="comanda-card-id">#{c.id}</span>
                    <span className="comanda-card-nome"> {c.cliente?.nome}</span>
                  </span>
                  <LocalBadge local={c.local} />
                </div>
                <div className="comanda-card-body">
                  <div className="comanda-card-info">
                    <div><span className="label">Cliente:</span> {c.cliente?.nome}</div>
                    <div><span className="label">Local:</span> {c.local}</div>
                    <div>
                      <span className="label">Aberta:</span>{' '}
                      {parseDate(c.dataAbertura)
                        ? parseDate(c.dataAbertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                      {' '}(Ha {tempoAberta(c.dataAbertura)})
                    </div>
                  </div>
                  <div className="comanda-card-total">TOTAL: {fmt(c.valorTotal)}</div>
                </div>
                <div className="comanda-card-actions">
                  <button className="btn btn-primary" onClick={e => { e.stopPropagation(); navigate('/comanda/' + c.id); }}>
                    + Lancar Item
                  </button>
                  <button className="btn btn-success" onClick={e => { e.stopPropagation(); navigate('/comanda/' + c.id); }}>
                    Fechar Comanda
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NOVA COMANDA */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header-bar"><h2>Nova Comanda</h2></div>
            <div className="form-group">
              <label>Cliente selecionado</label>
              <div style={{ background: '#fdf3e7', border: '1px solid #f0c89a', borderRadius: 6, padding: '10px 14px', fontSize: '0.9rem' }}>
                <strong>{clienteSelecionado?.nome}</strong> — {clienteSelecionado?.telefone}
              </div>
            </div>
            <div className="form-group">
              <label>Local / Mesa</label>
              <div className="pagamento-opcoes">
                {locaisOpcoes.map(op => (
                  <div key={op}
                    className={'pagamento-op' + (local === op ? ' selected' : '')}
                    onClick={() => setLocal(op)}
                  >{op}</div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setClienteSelecionado(null); }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={abrirComanda} disabled={loading}>
                {loading ? 'Abrindo...' : 'Abrir Comanda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
