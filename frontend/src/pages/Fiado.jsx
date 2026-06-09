import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function Fiado() {
  const [devedores, setDevedores] = useState([]);
  const [selecionado, setSelecionado] = useState(null);  // cliente com histórico
  const [showPagar, setShowPagar] = useState(false);
  const [valorPagamento, setValorPagamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const carregar = useCallback(async () => {
    const { data } = await api.get('/fiado');
    setDevedores(data);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function abrirDetalhe(cliente) {
    setLoadingDetalhe(true);
    try {
      const { data } = await api.get(`/fiado/${cliente.id}`);
      setSelecionado(data);
    } finally { setLoadingDetalhe(false); }
  }

  async function registrarPagamento() {
    if (!valorPagamento || Number(valorPagamento) <= 0) return;
    setLoading(true);
    try {
      await api.post(`/fiado/${selecionado.id}/pagar`, { valor: Number(valorPagamento) });
      setShowPagar(false);
      setValorPagamento('');
      // Recarrega dados
      const [lista, detalhe] = await Promise.all([
        api.get('/fiado'),
        api.get(`/fiado/${selecionado.id}`),
      ]);
      setDevedores(lista.data);
      setSelecionado(detalhe.data);
    } finally { setLoading(false); }
  }

  const totalFiado = devedores.reduce((a, c) => a + c.saldoFiado, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <h1 style={{ color: '#2c1501', fontSize: '1.4rem', fontWeight: 800 }}>Fiado</h1>
        <button className="btn btn-secondary btn-sm" onClick={carregar}>↻ Atualizar</button>
      </div>

      {/* Resumo */}
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#e94560' }}>{fmt(totalFiado)}</div>
          <div className="stat-label">Total em Fiado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{devedores.length}</div>
          <div className="stat-label">Clientes com Fiado</div>
        </div>
      </div>

      {devedores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 0' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>✅</p>
          <p className="empty">Nenhum cliente com fiado em aberto!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {devedores.map((c, i) => (
            <div
              key={c.id}
              className="fiado-row"
              style={{ borderTop: i > 0 ? '1px solid #f0ebe3' : 'none' }}
              onClick={() => abrirDetalhe(c)}
            >
              <div className="fiado-row-info">
                <span className="fiado-nome">{c.nome}</span>
                <span className="fiado-tel">{c.telefone}</span>
                {c.ultimoFiado && (
                  <span style={{ fontSize: '0.73rem', color: '#b07a3a', marginTop: 2 }}>
                    📅 Último fiado: {fmtData(c.ultimoFiado)}
                  </span>
                )}
              </div>
              <span className="fiado-valor">{fmt(c.saldoFiado)}</span>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALHE / HISTÓRICO */}
      {selecionado && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelecionado(null); }}>
          <div className="modal modal-wide">
            <div className="modal-header-bar">
              <h2>Fiado — {selecionado.nome}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelecionado(null)}>✕</button>
            </div>

            {/* Saldo atual */}
            <div style={{ background: selecionado.saldoFiado > 0 ? '#fff5f5' : '#f0fff4', border: `1.5px solid ${selecionado.saldoFiado > 0 ? '#fca5a5' : '#6ee7b7'}`, borderRadius: 8, padding: '14px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#555', fontWeight: 600 }}>Saldo devedor</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: selecionado.saldoFiado > 0 ? '#e94560' : '#27ae60' }}>
                {fmt(selecionado.saldoFiado)}
              </span>
            </div>

            {selecionado.saldoFiado > 0 && (
              <button className="btn btn-success" style={{ width: '100%', marginBottom: 18 }}
                onClick={() => { setValorPagamento(selecionado.saldoFiado.toFixed(2)); setShowPagar(true); }}>
                💰 Registrar Pagamento
              </button>
            )}

            {/* Histórico */}
            <h3 style={{ fontSize: '0.85rem', color: '#888', fontWeight: 700, marginBottom: 10 }}>HISTÓRICO</h3>
            {loadingDetalhe ? (
              <p className="empty">Carregando...</p>
            ) : selecionado.fiadoTransacoes.length === 0 ? (
              <p className="empty">Nenhuma transação.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selecionado.fiadoTransacoes.map(t => {
                  const [titulo, ...itens] = t.descricao ? t.descricao.split('\n') : [t.descricao];
                  return (
                    <li key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0ebe3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', color: '#444', fontWeight: 600 }}>{titulo}</div>
                          <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{fmtData(t.data)}</div>
                        </div>
                        <span style={{ fontWeight: 700, color: t.valor > 0 ? '#e94560' : '#27ae60', whiteSpace: 'nowrap', marginLeft: 12 }}>
                          {t.valor > 0 ? '+' : ''}{fmt(t.valor)}
                        </span>
                      </div>
                      {itens.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: '4px 0 0 8px', margin: 0 }}>
                          {itens.map((linha, idx) => (
                            <li key={idx} style={{ fontSize: '0.78rem', color: '#666', padding: '1px 0' }}>{linha}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setSelecionado(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      {showPagar && selecionado && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPagar(false); }}>
          <div className="modal">
            <div className="modal-header-bar">
              <h2>Receber Pagamento</h2>
            </div>
            <p style={{ color: '#555', marginBottom: 14 }}>
              Cliente: <strong>{selecionado.nome}</strong><br />
              Saldo devedor: <strong style={{ color: '#e94560' }}>{fmt(selecionado.saldoFiado)}</strong>
            </p>
            <div className="form-group">
              <label>Valor recebido (R$)</label>
              <input
                type="number" step="0.01" min="0.01"
                value={valorPagamento}
                onChange={e => setValorPagamento(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPagar(false)}>Cancelar</button>
              <button className="btn btn-success" onClick={registrarPagamento} disabled={loading}>
                {loading ? 'Salvando...' : '✓ Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
