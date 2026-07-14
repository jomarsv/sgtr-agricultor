# Ajustes aplicados na branch do PR

## O que foi alterado

1. As leituras em `problemas_agricultor`, `solicitacoes_visita` e `solicitacoes_whatsapp` passaram a usar `query(... where('beneficiarioId', '==', beneficiarioId))` em vez de listar a coleção inteira e filtrar no cliente.
2. O fluxo de pós-login em `AuthContext` foi endurecido para não derrubar a sessão quando falham apenas os registros auxiliares de auditoria (`access_logs`) ou atualização de `ultimoLoginEm`.
3. O botão de recuperação de senha deixou de usar `sendPasswordResetEmail` para o e-mail interno derivado do CPF e passou a orientar o agricultor a procurar a equipe SAF ou o técnico responsável.
4. O upload para o Firebase Storage passou a salvar os arquivos em `uploads/{uid}/...`, com saneamento básico do nome do arquivo.
5. As `storage.rules` foram reduzidas para aceitar gravação apenas quando o `userId` do caminho coincide com `request.auth.uid`.

## Por que foi alterado

### 1. Consultas compatíveis com as regras do Firestore

O PR original mantinha `onSnapshot(collection(...))` e depois fazia `filter` no navegador. Isso contraria o modelo de regras estritas já adotado no projeto e tende a gerar `permission-denied` em produção. A correção garante que a consulta já saia do Firestore limitada ao beneficiário autenticado.

### 2. Login não pode depender de log auxiliar

O PR original autenticava o usuário corretamente, mas depois ainda fazia gravações auxiliares no Firestore dentro do mesmo `try`. Se uma dessas gravações falhasse, a sessão era anulada no `catch`. Isso é incorreto para o objetivo do app: falha de auditoria não deve impedir o agricultor de entrar.

### 3. Recuperação de senha compatível com login por CPF

O app agricultor usa login por CPF mapeado para `cpf@sgtr.app`. Na prática, o agricultor normalmente não controla essa caixa de e-mail sintética. Por isso, o fluxo de envio de e-mail de redefinição criava uma UX enganosa. A orientação manual está mais alinhada ao processo atual do projeto.

### 4. Storage menos amplo

As regras novas do PR original exigiam autenticação, mas ainda permitiam que qualquer usuário autenticado gravasse em qualquer caminho dentro de `uploads/**`. Para reduzir a superfície de exposição, os arquivos passaram a ser organizados por UID e a regra de escrita foi limitada ao próprio usuário autenticado.

### 5. Aderência aos objetivos do projeto

As mudanças acima alinham o PR com os objetivos já definidos para o SGTR:

- acesso por perfil e por beneficiário;
- redução de risco de `permission-denied` em produção;
- menor exposição de dados e arquivos;
- fluxo operacional compatível com o uso real do app agricultor.
