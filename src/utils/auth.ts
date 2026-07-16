export function formatarCpf(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (!numeros) return '';
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

export function cpfParaEmailInterno(cpfFormatado: string) {
  const numeros = cpfFormatado.replace(/\D/g, '');
  return `${numeros}@sgtr.app`;
}

export function traduzirErroAuth(error: unknown): string {
  const code = (error as { code?: string })?.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'CPF ou senha incorretos. Verifique os dados e tente novamente.';
    case 'auth/user-not-found':
      return 'Usuário não encontrado. Verifique o CPF ou procure a equipe SAF.';
    case 'auth/invalid-email':
      return 'CPF inválido. Informe os 11 dígitos do CPF.';
    case 'auth/user-disabled':
      return 'Sua conta está desativada. Procure a equipe SAF.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'Operação não permitida. Entre em contato com o suporte.';
    default:
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
