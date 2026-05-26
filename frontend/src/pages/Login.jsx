import { useState } from 'react';
import '../App.css';

const SENHA_CORRETA = 'bar2024';

export default function Login({ onLogin }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);
  const [mostrar, setMostrar] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (senha === SENHA_CORRETA) {
      onLogin();
    } else {
      setErro(true);
      setSenha('');
      setTimeout(() => setErro(false), 2500);
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="bar-do">Bar do</span>
          <span className="bar-nome">João Acir</span>
        </div>
        <p className="login-sub">Painel Operacional</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Senha</label>
          <div className="login-input-wrap">
            <input
              type={mostrar ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className={`login-input${erro ? ' login-input-erro' : ''}`}
              autoFocus
            />
            <button
              type="button"
              className="login-olho"
              onClick={() => setMostrar(v => !v)}
              tabIndex={-1}
            >
              {mostrar ? '🙈' : '👁️'}
            </button>
          </div>
          {erro && <p className="login-erro">Senha incorreta. Tente novamente.</p>}
          <button type="submit" className="login-btn">Entrar</button>
        </form>
      </div>
    </div>
  );
}
