import { useState, useEffect } from 'react';
import api from '../api';

const CATEGORIAS = ['Cerveja', 'Drinks', 'Refrigerante', 'Água', 'Sucos', 'Porções', 'Espetinhos', 'Outros'];

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome: '', categoria: 'Cerveja', preco: '' });
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await api.get('/produtos/todos');
    setProdutos(data);
  }

  function abrirNovo() {
    setEditando(null);
    setForm({ nome: '', categoria: 'Cerveja', preco: '' });
    setShowForm(true);
  }

  function abrirEditar(p) {
    setEditando(p.id);
    setForm({ nome: p.nome, categoria: p.categoria, preco: p.preco });
    setShowForm(true);
  }

  async function salvar() {
    if (!form.nome || !form.preco) return;
    setLoading(true);
    try {
      if (editando) {
        await api.put(`/produtos/${editando}`, form);
      } else {
        await api.post('/produtos', form);
      }
      setShowForm(false);
      await carregar();
    } finally { setLoading(false); }
  }

  async function toggleAtivo(p) {
    await api.put(`/produtos/${p.id}`, { ativo: !p.ativo });
    await carregar();
  }

  const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const produtosFiltrados = produtos.filter(p =>
    !filtro || p.nome.toLowerCase().includes(filtro.toLowerCase()) || p.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  // Group by category
  const porCategoria = {};
  for (const p of produtosFiltrados) {
    if (!porCategoria[p.categoria]) porCategoria[p.categoria] = [];
    porCategoria[p.categoria].push(p);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: '#2c1501', fontSize: '1.4rem', fontWeight: 800 }}>Cardápio / Catálogo de Produtos</h1>
        <button className="btn btn-primary" onClick={abrirNovo}>+ Novo Produto</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <input
          placeholder="Buscar produto ou categoria..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: '0.95rem' }}
        />
      </div>

      {Object.entries(porCategoria).map(([cat, lista]) => (
        <div key={cat} className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '0.95rem', color: '#7f4b20', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {cat} <span style={{ fontWeight: 400, color: '#aaa' }}>({lista.length})</span>
          </h2>
          <ul className="itens-list">
            {lista.map(p => (
              <li key={p.id} className="item-row" style={{ opacity: p.ativo ? 1 : 0.45 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="item-nome">{p.nome}</span>
                  {!p.ativo && <span style={{ fontSize: '0.72rem', background: '#eee', color: '#999', padding: '2px 8px', borderRadius: 10 }}>inativo</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong style={{ color: '#e67e22' }}>{fmt(p.preco)}</strong>
                  <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                  <button
                    className={`btn btn-sm ${p.ativo ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleAtivo(p)}
                  >{p.ativo ? 'Desativar' : 'Ativar'}</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {produtosFiltrados.length === 0 && (
        <p className="empty">Nenhum produto encontrado.</p>
      )}

      {/* MODAL FORM */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header-bar">
              <h2>{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Nome do Produto</label>
              <input
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Brahma Lata 350ml"
                autoFocus
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Preço (R$)</label>
                <input
                  type="number" step="0.50" min="0"
                  value={form.preco}
                  onChange={e => setForm(p => ({ ...p, preco: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={loading || !form.nome || !form.preco}>
                {loading ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
