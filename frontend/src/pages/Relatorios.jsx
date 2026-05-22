import { useState, useEffect, useCallback } from 'react';
import api from '../api';

function hoje() { return new Date().toISOString().split('T')[0]; }
function diasAtras(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function inicioMes() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
}

const PERIODOS = [
  { label: 'Hoje',       inicio: () => hoje(),       fim: () => hoje() },
  { label: '7 dias',     inicio: () => diasAtras(6),  fim: () => hoje() },
  { label: 'Este mês',   inicio: () => inicioMes(),   fim: () => hoje() },
  { label: 'Tudo',       inicio: () => '',            fim: () => ''     },
];

function exportCSV(rows, colunas, nomeArquivo) {
  const header = colunas.map(c => c.label).join(';');
  const body   = rows.map(r => colunas.map(c => String(r[c.key] ?? '')).join(';')).join('\n');
  const blob   = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = nomeArquivo; a.click();
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const [vendasDia, setVendasDia]     = useState([]);
  const [produtos, setProdutos]       = useState([]);
  const [frequentes, setFrequentes]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [periodoIdx, setPeriodoIdx]   = useState(2); // "Este mês" padrão
  const [inicio, setInicio]           = useState(inicioMes());
  const [fim, setFim]                 = useState(hoje());
  const [custom, setCustom]           = useState(false);

  const params = inicio || fim ? { inicio: inicio || undefined, fim: fim || undefined } : {};

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get('/relatorios/vendas-por-dia', { params }),
        api.get('/relatorios/produtos-mais-vendidos', { params }),
        api.get('/relatorios/clientes-frequentes', { params }),
      ]);
      setVendasDia(r1.data);
      setProdutos(r2.data);
      setFrequentes(r3.data);
    } finally { setLoading(false); }
  }, [inicio, fim]);

  useEffect(() => { carregar(); }, [carregar]);

  function selecionarPeriodo(idx) {
    setPeriodoIdx(idx);
    setCustom(false);
    const p = PERIODOS[idx];
    setInicio(p.inicio());
    setFim(p.fim());
  }

  const fmt    = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDia = (d) => {
    if (!d) return '—';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  };

  const totalGeral    = vendasDia.reduce((a, v) => a + Number(v.total),         0);
  const totalComandas = vendasDia.reduce((a, v) => a + Number(v.totalComandas), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <h1 style={{ color: '#2c1501', fontSize: '1.4rem', fontWeight: 800 }}>Relatórios</h1>
        <button className="btn btn-secondary btn-sm" onClick={carregar} disabled={loading}>
          {loading ? 'Atualizando...' : '↻ Atualizar'}
        </button>
      </div>

      {/* FILTRO DE PERÍODO */}
      <div className="card" style={{ marginBottom: 18, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#888', fontWeight: 700, marginRight: 4 }}>PERÍODO:</span>
          {PERIODOS.map((p, i) => (
            <button
              key={p.label}
              className={`btn btn-sm ${!custom && periodoIdx === i ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => selecionarPeriodo(i)}
            >{p.label}</button>
          ))}
          <button
            className={`btn btn-sm ${custom ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCustom(true)}
          >Personalizado</button>
          {custom && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
                style={{ padding: '4px 8px', border: '1.5px solid #ddd', borderRadius: 6, fontSize: '0.85rem' }} />
              <span style={{ color: '#888' }}>até</span>
              <input type="date" value={fim} onChange={e => setFim(e.target.value)}
                style={{ padding: '4px 8px', border: '1.5px solid #ddd', borderRadius: 6, fontSize: '0.85rem' }} />
              <button className="btn btn-primary btn-sm" onClick={carregar}>Buscar</button>
            </div>
          )}
        </div>
        {(inicio || fim) && (
          <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 8, marginBottom: 0 }}>
            {inicio ? fmtDia(inicio) : '—'} a {fim ? fmtDia(fim) : '—'}
          </p>
        )}
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{fmt(totalGeral)}</div>
          <div className="stat-label">Faturamento Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalComandas}</div>
          <div className="stat-label">Comandas Fechadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{produtos.length}</div>
          <div className="stat-label">Produtos Diferentes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{frequentes.length}</div>
          <div className="stat-label">Clientes Ativos</div>
        </div>
      </div>

      {loading ? <p className="empty">Carregando...</p> : <>

      {/* VENDAS POR DIA */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem', color: '#555', margin: 0 }}>VENDAS POR DIA</h2>
          {vendasDia.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => exportCSV(
              vendasDia,
              [{ label: 'Data', key: 'data' }, { label: 'Comandas', key: 'totalComandas' }, { label: 'Total (R$)', key: 'total' }],
              'vendas-por-dia.csv'
            )}>⬇ Exportar CSV</button>
          )}
        </div>
        {vendasDia.length === 0 ? (
          <p className="empty" style={{ padding: '20px 0' }}>Nenhum dado disponível.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Comandas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {vendasDia.map((v, i) => (
                <tr key={i}>
                  <td>{fmtDia(v.data)}</td>
                  <td>{v.totalComandas}</td>
                  <td><strong style={{ color: '#e94560' }}>{fmt(v.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="relatorios-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* PRODUTOS MAIS VENDIDOS */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', color: '#555', margin: 0 }}>PRODUTOS MAIS VENDIDOS</h2>
            {produtos.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => exportCSV(
                produtos,
                [{ label: 'Produto', key: 'nomeProduto' }, { label: 'Qtd', key: 'totalQuantidade' }, { label: 'Total (R$)', key: 'totalVendido' }],
                'produtos-mais-vendidos.csv'
              )}>⬇</button>
            )}
          </div>
          {produtos.length === 0 ? (
            <p className="empty" style={{ padding: '16px 0' }}>Nenhum dado.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Produto</th><th>Qtd</th><th>Total</th></tr>
              </thead>
              <tbody>
                {produtos.slice(0, 10).map((p, i) => (
                  <tr key={i}>
                    <td>{p.nomeProduto}</td>
                    <td>{p.totalQuantidade}</td>
                    <td>{fmt(p.totalVendido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CLIENTES FREQUENTES */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', color: '#555', margin: 0 }}>CLIENTES FREQUENTES</h2>
            {frequentes.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => exportCSV(
                frequentes,
                [{ label: 'Cliente', key: 'nome' }, { label: 'Visitas', key: 'totalComandas' }, { label: 'Total Gasto (R$)', key: 'totalGasto' }],
                'clientes-frequentes.csv'
              )}>⬇</button>
            )}
          </div>
          {frequentes.length === 0 ? (
            <p className="empty" style={{ padding: '16px 0' }}>Nenhum dado.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Cliente</th><th>Visitas</th><th>Total</th></tr>
              </thead>
              <tbody>
                {frequentes.map((c, i) => (
                  <tr key={i}>
                    <td>{c.nome}</td>
                    <td>{c.totalComandas}</td>
                    <td>{fmt(c.totalGasto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      </>}
    </div>
  );
}
