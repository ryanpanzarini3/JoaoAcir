import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Comanda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comanda, setComanda] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showFechar, setShowFechar] = useState(false);
  const [item, setItem] = useState({ nomeProduto: '', quantidade: 1, valorUnitario: '' });
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [loading, setLoading] = useState(false);
  const [adicionandoId, setAdicionandoId] = useState(null);
  const [removendoId, setRemovendoId] = useState(null);
  const [erro, setErro] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  useEffect(() => { carregar(); }, [id]);

  async function carregar() {
    const { data } = await api.get(`/comandas/${id}`);
    setComanda(data);
  }

  async function abrirModalItem() {
    setErro('');
    setItem({ nomeProduto: '', quantidade: 1, valorUnitario: '' });
    setBuscaProduto('');
    if (produtos.length === 0) {
      const { data } = await api.get('/produtos');
      setProdutos(data);
      if (data.length > 0) {
        const cats = [...new Set(data.map(p => p.categoria))];
        setCategoriaSelecionada(cats[0]);
      }
    }
    setShowAddItem(true);
  }

  function selecionarProduto(produto) {
    setItem({ nomeProduto: produto.nome, quantidade: 1, valorUnitario: produto.preco });
  }

  async function adicionarItem() {
    if (!item.nomeProduto || !item.quantidade || !item.valorUnitario) {
      setErro('Preencha todos os campos do item.'); return;
    }
    setLoading(true); setErro('');
    try {
      await api.post(`/comandas/${id}/itens`, item);
      setItem({ nomeProduto: '', quantidade: 1, valorUnitario: '' });
      setShowAddItem(false);
      await carregar();
    } catch { setErro('Erro ao adicionar item.'); }
    finally { setLoading(false); }
  }

  async function adicionarMaisUm(itemExistente) {
    setAdicionandoId(itemExistente.id);
    try {
      await api.post(`/comandas/${id}/itens`, {
        nomeProduto: itemExistente.nomeProduto,
        quantidade: 1,
        valorUnitario: itemExistente.valorUnitario,
      });
      await carregar();
    } finally { setAdicionandoId(null); }
  }

  async function removerUmaUnidade(itemExistente) {
    setRemovendoId(itemExistente.id);
    try {
      await api.patch(`/comandas/${id}/itens/${itemExistente.id}`, { quantidade: 1 });
      await carregar();
    } finally {
      setRemovendoId(null);
    }
  }

  async function removerItem(itemId) {
    if (!confirm('Remover este item?')) return;
    setRemovendoId(itemId);
    try {
      await api.delete(`/comandas/${id}/itens/${itemId}`);
      await carregar();
    } finally {
      setRemovendoId(null);
    }
  }

  async function fecharComanda() {
    setLoading(true);
    try {
      await api.patch(`/comandas/${id}/fechar`, { formaPagamento });
      await carregar();
      setShowFechar(false);
    } finally { setLoading(false); }
  }

  const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => {
    const date = parseDate(d);
    return date ? date.toLocaleString('pt-BR') : '—';
  };
  const categorias = [...new Set(produtos.map(p => p.categoria))];
  const produtosFiltrados = produtos.filter(p => {
    const contemCategoria = p.categoria === categoriaSelecionada;
    const contemBusca = buscaProduto.trim() === '' || p.nome.toLowerCase().includes(buscaProduto.toLowerCase());
    return contemCategoria && contemBusca;
  });

  if (!comanda) return <p className="empty">Carregando...</p>;

  return (
    <div>
      <div className="comanda-header">
        <div className="comanda-info">
          <h1>Comanda #{comanda.id}</h1>
          <p>👤 {comanda.cliente?.nome} · 📞 {comanda.cliente?.telefone}</p>
          <p>🕐 Aberta em {fmtData(comanda.dataAbertura)}</p>
          {comanda.dataFechamento && <p>✅ Fechada em {fmtData(comanda.dataFechamento)} · {comanda.formaPagamento}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <span className={`badge badge-${comanda.status}`} style={{ padding: '6px 14px', fontSize: '0.9rem' }}>
            {comanda.status}
          </span>
          {comanda.status === 'aberta' && (
            <>
              <button className="btn btn-primary" onClick={abrirModalItem}>+ Item</button>
              <button className="btn btn-success" onClick={() => setShowFechar(true)}>Fechar Comanda</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/')}>← Voltar</button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: '1rem', color: '#555' }}>ITENS CONSUMIDOS</h2>
        {comanda.itens.length === 0 ? (
          <p className="empty" style={{ padding: '24px 0' }}>Nenhum item adicionado ainda.</p>
        ) : (
          <ul className="itens-list">
            {comanda.itens.map(i => (
              <li key={i.id} className="item-row">
                <div>
                  <div className="item-nome">{i.nomeProduto}</div>
                  <div className="item-detalhe">{i.quantidade}x {fmt(i.valorUnitario)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{fmt(i.valorTotal)}</strong>
                  {comanda.status === 'aberta' && (
                    <>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => removerUmaUnidade(i)}
                        disabled={removendoId === i.id}
                        title={`Remover uma unidade de ${i.nomeProduto}`}
                      >-</button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => adicionarMaisUm(i)}
                        disabled={adicionandoId === i.id}
                        title={`Adicionar mais um ${i.nomeProduto}`}
                      >+</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removerItem(i.id)}
                        disabled={removendoId === i.id}
                        title={`Remover todo o item ${i.nomeProduto}`}
                      >✕</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="total-bar">
          <span>Total</span>
          <span style={{ color: '#e94560' }}>{fmt(comanda.valorTotal)}</span>
        </div>
      </div>

      {/* MODAL ADICIONAR ITEM */}
      {showAddItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddItem(false)}>
          <div className="modal modal-wide">
            <div className="modal-header-bar">
              <h2>Lançar Item — Comanda #{comanda.id}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddItem(false)}>✕</button>
            </div>
            {erro && <div className="alert alert-error">{erro}</div>}

            {/* Barra de Pesquisa */}
            <div className="form-group" style={{ margin: '12px 0 16px 0' }}>
              <input
                type="text"
                placeholder="🔍 Procurar por item..."
                value={buscaProduto}
                onChange={e => setBuscaProduto(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '0.95rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* utton className="btn btn-secondary btn-sm" onClick={() => setShowAddItem(false)}>✕</button>
            </div>
            {erro && <div className="alert alert-error">{erro}</div>}

            {/* Abas de categoria */}
            {categorias.length > 0 && (
              <div className="categoria-tabs">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    className={`categoria-tab ${categoriaSelecionada === cat ? 'categoria-tab-ativa' : ''}`}
                    onClick={() => setCategoriaSelecionada(cat)}
                  >{cat}</button>
                ))}
              </div>
            )}

            {/* Grid de produtos */}
            <div className="produto-grid">
              {produtosFiltrados.map(p => (
                <button
                  key={p.id}
                  className={`produto-card ${item.nomeProduto === p.nome ? 'produto-card-ativo' : ''}`}
                  onClick={() => selecionarProduto(p)}
                >
                  <span className="produto-card-nome">{p.nome}</span>
                  <span className="produto-card-preco">{fmt(p.preco)}</span>
                </button>
              ))}
            </div>

            {/* Campos de ajuste */}
            <div className="item-form-linha">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Produto selecionado</label>
                <input
                  value={item.nomeProduto}
                  onChange={e => setItem(prev => ({ ...prev, nomeProduto: e.target.value }))}
                  placeholder="Selecione acima ou digite manualmente"
                />
              </div>
              <div className="form-group" style={{ flex: 0.6 }}>
                <label>Qtd</label>
                <input type="number" min="1" value={item.quantidade}
                  onChange={e => setItem(prev => ({ ...prev, quantidade: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Valor Unit. (R$)</label>
                <input type="number" step="0.01" min="0" value={item.valorUnitario}
                  placeholder="0,00"
                  onChange={e => setItem(prev => ({ ...prev, valorUnitario: e.target.value }))} />
              </div>
            </div>

            {item.nomeProduto && item.quantidade && item.valorUnitario && (
              <p className="subtotal-preview">
                Subtotal: <strong>{fmt(item.quantidade * item.valorUnitario)}</strong>
              </p>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddItem(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={adicionarItem} disabled={loading}>
                {loading ? 'Salvando...' : '✓ Adicionar à Comanda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FECHAR COMANDA */}
      {showFechar && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowFechar(false)}>
          <div className="modal">
            <h2>Fechar Comanda #{comanda.id}</h2>
            <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 16, marginBottom: 18 }}>
              <p style={{ color: '#555', marginBottom: 4 }}>Cliente: <strong>{comanda.cliente?.nome}</strong></p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e94560' }}>Total: {fmt(comanda.valorTotal)}</p>
            </div>
            <div className="form-group">
              <label>Forma de Pagamento</label>
              <div className="pagamento-opcoes">
                {['Dinheiro', 'Pix', 'Cartão de Débito', 'Cartão de Crédito', 'Fiado'].map(op => (
                  <div key={op}
                    className={'pagamento-op' + (formaPagamento === op ? ' selected' : '') + (op === 'Fiado' ? ' pagamento-fiado' : '')}
                    onClick={() => setFormaPagamento(op)}
                  >{op}</div>
                ))}
              </div>
              {formaPagamento === 'Fiado' && (
                <div className="alert alert-warn" style={{ marginTop: 10 }}>
                  ⚠️ O valor de <strong>{fmt(comanda.valorTotal)}</strong> será adicionado ao fiado do cliente.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowFechar(false)}>Cancelar</button>
              <button className="btn btn-success" onClick={fecharComanda} disabled={loading}>
                {loading ? 'Fechando...' : '✓ Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
