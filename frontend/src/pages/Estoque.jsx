import { useState, useEffect } from 'react';
import api from '../api';

function parseEstoque(qtd) {
  if (qtd === undefined || qtd === null) return 0n;
  return typeof qtd === 'string' ? BigInt(qtd) : BigInt(qtd);
}

function formatEstoque(qtd) {
  return String(parseEstoque(qtd));
}

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
    const qtd = Number(novaQtd);
    if (novaQtd === '' || isNaN(qtd) || qtd < 0 || qtd > 999999) {
      setErro('Quantidade inválida (máximo: 999.999)');
      setTimeout(() => setErro(''), 4000);
      return;
    }
    setLoading(true);
    setErro('');
    try {
      await api.patch(`/estoque/${id}`, { quantidade: qtd });
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

  async function excluir(id) {
    const confirmacao = window.confirm('Tem certeza que deseja remover este produto do estoque?');
    if (!confirmacao) return;

    setLoading(true);
    setErro('');
    try {
      await api.delete(`/estoque/${id}`);
      setMsg('Produto removido do estoque!');
      await carregar();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      const mensagem = e?.response?.data?.erro || 'Erro ao excluir. Tente novamente.';
      setErro(mensagem);
      setTimeout(() => setErro(''), 4000);
    } finally {
      setLoading(false);
    }
  }

  async function excluirPermanente(p) {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE "${p.nome}"?\n\nEssa ação é IRREVERSÍVEL.`)) return;
    if (!window.confirm(`⚠️ ÚLTIMA CONFIRMAÇÃO ⚠️\n\n"${p.nome}" será deletado do banco de dados.\n\nDeseja continuar?`)) return;

    setLoading(true);
    setErro('');
    try {
      await api.delete(`/estoque/${p.id}/permanent`);
      setMsg('Produto excluído permanentemente!');
      await carregar();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      const mensagem = e?.response?.data?.erro || 'Erro ao excluir. Tente novamente.';
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
    const quantidade = parseEstoque(qtd);
    if (quantidade === 0n) return '#e74c3c';
    if (quantidade <= 5n) return '#e67e22';
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
                        max="999999"
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
                        {formatEstoque(p.quantidadeEstoque)} un
                      </span>
                      {parseEstoque(p.quantidadeEstoque) === 0n && (
                        <span style={{ fontSize: '0.72rem', background: '#fde8e8', color: '#e74c3c', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          SEM ESTOQUE
                        </span>
                      )}
                      {parseEstoque(p.quantidadeEstoque) > 0n && parseEstoque(p.quantidadeEstoque) <= 5n && (
                        <span style={{ fontSize: '0.72rem', background: '#fef3e2', color: '#e67e22', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          BAIXO
                        </span>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => excluir(p.id)} disabled={loading}>Excluir</button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#c0392b', color: 'white', border: 'none', cursor: 'pointer' }}
                        onClick={() => excluirPermanente(p)}
                        disabled={loading}
                        title="Excluir permanentemente este produto"
                      >🗑️ Deletar</button>
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
