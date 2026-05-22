import { useState, useEffect } from 'react';
import api from '../api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '', cpf: '', observacoes: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar(q = '') {
    const { data } = await api.get(`/clientes${q ? `?busca=${encodeURIComponent(q)}` : ''}`);
    setClientes(data);
  }

  function abrirNovo() {
    setEditando(null);
    setForm({ nome: '', telefone: '', cpf: '', observacoes: '' });
    setErro('');
    setShowModal(true);
  }

  function abrirEdicao(c) {
    setEditando(c);
    setForm({ nome: c.nome, telefone: c.telefone, cpf: c.cpf || '', observacoes: c.observacoes || '' });
    setErro('');
    setShowModal(true);
  }

  async function salvar() {
    if (!form.nome.trim() || !form.telefone.trim()) {
      setErro('Nome e telefone são obrigatórios.'); return;
    }
    setLoading(true); setErro('');
    try {
      if (editando) {
        await api.put(`/clientes/${editando.id}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setShowModal(false);
      await carregar(busca);
    } catch (e) {
      setErro('Erro ao salvar cliente.');
    } finally { setLoading(false); }
  }

  async function pesquisar() {
    await carregar(busca);
  }

  const fmtData = (d) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={abrirNovo}>+ Novo Cliente</button>
      </div>

      <div className="search-bar">
        <input
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pesquisar()}
        />
        <button className="btn btn-secondary" onClick={pesquisar}>Buscar</button>
        {busca && <button className="btn btn-outline" onClick={() => { setBusca(''); carregar(); }}>Limpar</button>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {clientes.length === 0 ? (
          <p className="empty">Nenhum cliente encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th className="col-hide-mobile">CPF</th>
                <th className="col-hide-mobile">Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nome}</strong></td>
                  <td>{c.telefone}</td>
                  <td className="col-hide-mobile">{c.cpf || '—'}</td>
                  <td className="col-hide-mobile">{fmtData(c.dataCadastro)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => abrirEdicao(c)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>{editando ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            {erro && <div className="alert alert-error">{erro}</div>}
            <div className="form-group">
              <label>Nome completo *</label>
              <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="João da Silva" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Telefone *</label>
                <input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-0000" />
              </div>
              <div className="form-group">
                <label>CPF (opcional)</label>
                <input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="form-group">
              <label>Observações</label>
              <textarea
                rows={2}
                value={form.observacoes}
                onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                placeholder="Ex: cliente VIP, alergia a amendoim..."
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
