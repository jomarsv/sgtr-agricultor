import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { cpfParaEmailInterno, traduzirErroAuth } from '../utils/auth';

export type UsuarioAgricultor = {
  uid: string;
  nome: string;
  perfil: 'agricultor';
  cpf?: string;
  cpfMasked?: string;
  beneficiarioId?: string;
  macroRegiaoId?: string;
  lgpdConsentimentoAppsMesmoControlador?: boolean;
  lgpdConsentimentoAppsMesmoControladorEm?: unknown;
  lgpdConsentimentoAppsMesmoControladorVersao?: string;
  ativo: boolean;
  ultimoLoginEm?: unknown;
};

type AuthContextValue = {
  usuarioSistema: UsuarioAgricultor | null;
  authLoading: boolean;
  loginMsg: string;
  clearLoginMsg: () => void;
  realizarLogin: (cpf: string, senha: string) => Promise<void>;
  solicitarResetSenha: (cpf: string) => Promise<string>;
  sairDoSistema: () => Promise<void>;
  atualizarUsuarioSistema: (patch: Partial<UsuarioAgricultor>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuarioSistema, setUsuarioSistema] = useState<UsuarioAgricultor | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginMsg, setLoginMsg] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuarioSistema(null);
        setAuthLoading(false);
        return;
      }

      try {
        setAuthLoading(true);
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await signOut(auth);
          setLoginMsg('Usuário autenticado, mas não encontrado na base do sistema.');
          return;
        }

        const userData = { uid: user.uid, ...userSnap.data() } as UsuarioAgricultor;

        if (!userData.ativo) {
          await signOut(auth);
          setLoginMsg('Seu acesso está inativo no sistema.');
          return;
        }

        if (userData.perfil !== 'agricultor') {
          await signOut(auth);
          setLoginMsg('Este acesso não pertence ao app agricultor.');
          return;
        }

        if (!userData.beneficiarioId) {
          await signOut(auth);
          setLoginMsg('Seu cadastro ainda não está vinculado a um beneficiário.');
          return;
        }

        setUsuarioSistema(userData);
        setLoginMsg('');

        await addDoc(collection(db, 'access_logs'), {
          uid: userData.uid,
          nome: userData.nome,
          perfil: userData.perfil,
          macroRegiaoId: userData.macroRegiaoId || null,
          tecnicoId: null,
          beneficiarioId: userData.beneficiarioId,
          appOrigem: 'app-agricultor',
          evento: 'login',
          timestamp: serverTimestamp()
        });

        await setDoc(doc(db, 'usuarios', userData.uid), { ultimoLoginEm: serverTimestamp() }, { merge: true });
      } catch (error: unknown) {
        console.error(error);
        setUsuarioSistema(null);
        const message = error instanceof Error ? error.message : 'Falha ao iniciar sessão.';
        setLoginMsg(message);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  async function realizarLogin(cpf: string, senha: string) {
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11 || !senha) {
      setLoginMsg('Informe CPF e senha para entrar.');
      return;
    }

    try {
      setAuthLoading(true);
      setLoginMsg('Validando acesso...');
      await signInWithEmailAndPassword(auth, cpfParaEmailInterno(cpf), senha);
      setLoginMsg('');
    } catch (error) {
      console.error(error);
      setLoginMsg(traduzirErroAuth(error));
      setAuthLoading(false);
    }
  }

  async function solicitarResetSenha(cpf: string) {
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      return 'Informe um CPF válido com 11 dígitos para recuperar a senha.';
    }

    try {
      await sendPasswordResetEmail(auth, cpfParaEmailInterno(cpf));
      return 'Se o CPF estiver cadastrado, você receberá um e-mail com instruções para redefinir a senha.';
    } catch (error) {
      console.error(error);
      return traduzirErroAuth(error);
    }
  }

  async function sairDoSistema() {
    try {
      await signOut(auth);
      setUsuarioSistema(null);
      setLoginMsg('Sessão encerrada com sucesso.');
    } catch (error) {
      console.error(error);
      setLoginMsg('Erro ao sair do sistema.');
    }
  }

  function atualizarUsuarioSistema(patch: Partial<UsuarioAgricultor>) {
    setUsuarioSistema((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const value = useMemo(
    () => ({
      usuarioSistema,
      authLoading,
      loginMsg,
      clearLoginMsg: () => setLoginMsg(''),
      realizarLogin,
      solicitarResetSenha,
      sairDoSistema,
      atualizarUsuarioSistema
    }),
    [usuarioSistema, authLoading, loginMsg]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
