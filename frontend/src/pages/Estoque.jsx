import { useState, useEffect } from 'react';
import api from '../api';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [editando, setEditando] = useState(null); // id do produto em edição
  const [novaQtd, setNovaQtd] = useState('');
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await api.get('/estoque');
    setProdutos(data);
  }

  function abrirEditar(p) {
    setEditando(p.id);
    setNovaQtd(String(p.quantidadeEstoque));
    setMsg('');
  }

  function cancelar() {
    setEditando(null);
    setNovaQtd('');
  }

  async function salvar(id) {
    if (novaQtd === '' || isNaN(Number(novaQtd)) || Number(novaQtd) < 0) return;
    setLoading(true);
    setErro('');
    try {
      await api.patch(`/estoque/${id}`, { quantidade: Number(novaQtd) });
      setMsg('Estoque atualizado!');
      setEditando(null);
      await carregar();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      const mensagem = e?.response?.data?.erro || 'Erro ao salvar. Tente novamente.';
      setErro(mensagem);
      setTimeout(() => setErro(''), 4000);
    } finally {
      setLoading(false);
    }
  }

  const filtrados = produtos.filter(p =>
    !filtro ||
    p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    p.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  // Agrupar por categoria
  const porCategoria = {};
  for (const p of filtrados) {
    if (!porCategoria[p.categoria]) porCategoria[p.categoria] = [];
    porCategoria[p.categoria].push(p);
  }

  function corEstoque(qtd) {
    if (qtd === 0) return '#e74c3c';
    if (qtd <= 5) return '#e67e22';
    return '#27ae60';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: '#2c1501', fontSize: '1.4rem', fontWeight: 800 }}>Estoque</h1>
        {msg && (
          <span style={{ background: '#d4edda', color: '#155724', padding: '6px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' }}>
            {msg}
          </span>
        )}
        {erro && (
          <span style={{ background: '#fde8e8', color: '#c0392b', padding: '6px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' }}>
            {erro}
          </span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <input
          placeholder="Buscar produto ou categoria..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: '0.95rem' }}
        />
      </div>

      {filtrados.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
          Nenhum produto cadastrado. Cadastre produtos no Cardápio primeiro.
        </div>
      )}

      {Object.entries(porCategoria).map(([cat, lista]) => (
        <div key={cat} className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '0.95rem', color: '#7f4b20', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {cat} <span style={{ fontWeight: 400, color: '#aaa' }}>({lista.length})</span>
          </h2>
          <ul className="itens-list">
            {lista.map(p => (
              <li key={p.id} className="item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="item-nome">{p.nome}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {editando === p.id ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        value={novaQtd}
                        onChange={e => setNovaQtd(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvar(p.id); if (e.key === 'Escape') cancelar(); }}
                        autoFocus
                        style={{ width: 80, padding: '6px 10px', border: '1.5px solid #e67e22', borderRadius: 8, fontSize: '0.95rem', textAlign: 'center' }}
                      />
                      <button className="btn btn-success btn-sm" onClick={() => salvar(p.id)} disabled={loading}>Salvar</button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelar}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: corEstoque(p.quantidadeEstoque),
                        minWidth: 80,
                        textAlign: 'right'
                      }}>
                        {p.quantidadeEstoque} un
                      </span>
                      {p.quantidadeEstoque === 0 && (
                        <span style={{ fontSize: '0.72rem', background: '#fde8e8', color: '#e74c3c', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          SEM ESTOQUE
                        </span>
                      )}
                      {p.quantidadeEstoque > 0 && p.quantidadeEstoque <= 5 && (
                        <span style={{ fontSize: '0.72rem', background: '#fef3e2', color: '#e67e22', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          BAIXO
                        </span>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
