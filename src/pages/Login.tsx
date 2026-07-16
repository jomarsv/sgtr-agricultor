import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatarCpf } from '../utils/auth';

const colors = {
  bg: '#eef4ea',
  text: '#172117',
  muted: '#5d6e61',
  border: '#d7e1d2',
  card: '#ffffff',
  chip: '#f6f1e7',
  primary: '#2f7a3c',
  primaryDark: '#1d4f2c',
  primarySoft: '#dce9d8'
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: colors.card,
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 8px 22px rgba(31, 77, 43, 0.08)',
    ...extra
  };
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: '#d8ecd5',
        color: '#24522d'
      }}
    >
      {text}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: '14px 16px',
          fontSize: 14,
          background: '#fff',
          color: colors.text,
          outline: 'none'
        }}
      />
    </div>
  );
}

function ActionButton({
  text,
  onClick,
  secondary = false,
  disabled = false
}: {
  text: string;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        borderRadius: 18,
        border: secondary ? `1px solid ${colors.border}` : 'none',
        background: secondary ? '#fff' : colors.primary,
        color: secondary ? colors.primaryDark : '#fff',
        padding: '14px 16px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1
      }}
    >
      {text}
    </button>
  );
}

export function Login() {
  const { authLoading, loginMsg, realizarLogin } = useAuth();
  const [loginForm, setLoginForm] = useState({ cpf: '', senha: '' });
  const [resetMsg, setResetMsg] = useState('');

  async function handleLogin() {
    setResetMsg('');
    await realizarLogin(loginForm.cpf, loginForm.senha);
  }

  function handleOrientacaoSenha() {
    setResetMsg('Para redefinir a senha do acesso por CPF, procure a equipe SAF ou o técnico responsável. Esse app não envia recuperação por e-mail para o agricultor.');
  }

  const feedbackMsg = resetMsg || loginMsg;
  const feedbackSuccess =
    feedbackMsg.toLowerCase().includes('sucesso') || feedbackMsg.toLowerCase().includes('receberá');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bg,
        padding: 20,
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}
    >
      <div style={cardStyle({ width: 'min(520px, 100%)' })}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>MeuCampo Agricultor</div>
          <div style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
            Entre com seu CPF e sua senha para acessar seu atendimento.
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <Input
            label="CPF"
            value={loginForm.cpf}
            onChange={(v) => setLoginForm((prev) => ({ ...prev, cpf: formatarCpf(v) }))}
            placeholder="000.000.000-00"
          />
          <Input
            label="Senha"
            value={loginForm.senha}
            onChange={(v) => setLoginForm((prev) => ({ ...prev, senha: v }))}
            placeholder="Digite sua senha"
            type="password"
          />
          <ActionButton text={authLoading ? 'Entrando...' : 'Entrar'} onClick={handleLogin} disabled={authLoading} />
          <ActionButton
            text="Preciso redefinir minha senha"
            onClick={handleOrientacaoSenha}
            secondary
            disabled={authLoading}
          />
        </div>

        <div style={{ marginTop: 16, background: colors.chip, borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 13, color: colors.muted }}>Quem pode entrar aqui</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <Badge text="Agricultor" />
          </div>
        </div>

        {feedbackMsg && (
          <div
            style={{
              marginTop: 14,
              fontSize: 14,
              color: feedbackSuccess ? '#166534' : '#8b1e1e'
            }}
          >
            {feedbackMsg}
          </div>
        )}
      </div>
    </div>
  );
}
