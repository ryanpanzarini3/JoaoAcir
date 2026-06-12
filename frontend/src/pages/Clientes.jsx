import { useState, useEffect } from 'react';
import api from '../api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showDetalhe, setShowDetalhe] = useState(false);
  const [clienteDetalhe, setClienteDetalhe] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [valorFiado, setValorFiado] = useState('');
  const [descricaoFiado, setDescricaoFiado] = useState('');
  const [form, setForm] = useState({ nome: '', telefone: '', cpf: '', observacoes: '' });
  const [loading, setLoading] = useState(false);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
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

  async function abrirDetalhe(cliente) {
    setLoadingDetalhe(true);
    setErro('');
    try {
      const { data } = await api.get(`/fiado/${cliente.id}`);
      setClienteDetalhe(data);
      setActiveTab('info');
      setValorFiado('');
      setDescricaoFiado('');
      setShowDetalhe(true);
    } catch (e) {
      setErro('Erro ao carregar detalhes do cliente.');
    } finally {
      setLoadingDetalhe(false);
    }
  }

  async function registrarFiado() {
    const valor = Number(String(valorFiado).replace(',', '.'));
    if (!valor || valor <= 0) {
      setErro('Informe um valor válido para o fiado.');
      return;
    }

    setLoading(true);
    setErro('');
    try {
      await api.post(`/fiado/${clienteDetalhe.id}/fiar`, {
        valor,
        descricao: descricaoFiado || 'Fiado manual no cadastro de cliente',
      });
      setValorFiado('');
      setDescricaoFiado('');

      const { data } = await api.get(`/fiado/${clienteDetalhe.id}`);
      setClienteDetalhe(data);
      await carregar(busca);
      setActiveTab('fiado');
    } catch (e) {
      setErro(e?.response?.data?.erro || 'Erro ao registrar fiado.');
    } finally {
      setLoading(false);
    }
  }

  const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const fmtData = (d) => {
    const date = parseDate(d);
    return date ? date.toLocaleDateString('pt-BR') : '—';
  };

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
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={() => abrirDetalhe(c)}>Fiado</button>
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

      {showDetalhe && clienteDetalhe && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDetalhe(false); }}>
          <div className="modal modal-wide">
            <div className="modal-header-bar">
              <h2>{clienteDetalhe.nome}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDetalhe(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button
                className={activeTab === 'info' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => setActiveTab('info')}
              >Informações</button>
              <button
                className={activeTab === 'fiado' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => setActiveTab('fiado')}
              >Fiado</button>
            </div>

            {activeTab === 'info' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="card" style={{ padding: 14 }}>
                    <strong>Telefone</strong>
                    <p>{clienteDetalhe.telefone}</p>
                  </div>
                  <div className="card" style={{ padding: 14 }}>
                    <strong>CPF</strong>
                    <p>{clienteDetalhe.cpf || '—'}</p>
                  </div>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <strong>Observações</strong>
                  <p>{clienteDetalhe.observacoes || 'Nenhuma observação.'}</p>
                </div>
                <div className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Saldo de fiado atual</span>
                  <strong style={{ color: clienteDetalhe.saldoFiado > 0 ? '#e94560' : '#27ae60' }}>
                    {Number(clienteDetalhe.saldoFiado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </div>
              </div>
            )}

            {activeTab === 'fiado' && (
              <>
                <div className="card" style={{ marginBottom: 16, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#777' }}>Saldo atual</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: clienteDetalhe.saldoFiado > 0 ? '#e94560' : '#27ae60' }}>
                        {Number(clienteDetalhe.saldoFiado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Valor do fiado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valorFiado}
                    onChange={e => setValorFiado(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Observação (opcional)</label>
                  <textarea
                    rows={3}
                    value={descricaoFiado}
                    onChange={e => setDescricaoFiado(e.target.value)}
                    placeholder="Ex: dívida antiga de fevereiro"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 7, fontSize: '0.95rem', resize: 'vertical' }}
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowDetalhe(false)}>Cancelar</button>
                  <button className="btn btn-success" onClick={registrarFiado} disabled={loading}>
                    {loading ? 'Registrando...' : 'Adicionar ao Fiado'}
                  </button>
                </div>
                <div style={{ marginTop: 22 }}>
                  <h3 style={{ fontSize: '0.85rem', color: '#888', fontWeight: 700, marginBottom: 12 }}>Histórico de Fiado</h3>
                  {clienteDetalhe.fiadoTransacoes.length === 0 ? (
                    <p className="empty">Nenhuma transação registrada.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {clienteDetalhe.fiadoTransacoes.map(t => (
                        <li key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0ebe3' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', color: '#333' }}>{t.descricao || 'Fiado manual'}</div>
                              <div style={{ fontSize: '0.78rem', color: '#888' }}>{new Date(t.data).toLocaleString('pt-BR')}</div>
                            </div>
                            <span style={{ fontWeight: 700, color: t.valor > 0 ? '#e94560' : '#27ae60' }}>
                              {t.valor > 0 ? '+' : ''}{Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
