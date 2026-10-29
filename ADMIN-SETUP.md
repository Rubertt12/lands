# Configuração do painel administrativo

O painel está em \`/admin.html\`. Ele usa funções serverless do Vercel, autenticação TOTP e o GitHub como armazenamento do conteúdo — sem Supabase.

## Variáveis de ambiente do Vercel

No projeto \`portifolio\`, abra **Settings → Environment Variables** e crie as variáveis abaixo. Para o primeiro uso, selecione **Production**. Não coloque esses valores no HTML, JavaScript público ou repositório.

- \`ADMIN_PASSWORD\`: uma senha administrativa longa, exclusiva e que não seja usada em outros sites.
- \`ADMIN_TOTP_SECRET\`: segredo Base32 aleatório para o aplicativo autenticador.
- \`SESSION_SECRET\`: segredo aleatório de pelo menos 32 bytes para assinar as sessões.
- \`GITHUB_TOKEN\`: token Fine-grained do GitHub, limitado ao repositório \`Rubertt12/lands\`, com permissão **Contents: Read and write**.
- \`GITHUB_OWNER\`: \`Rubertt12\`
- \`GITHUB_REPO\`: \`lands\`
- \`GITHUB_BRANCH\`: \`main\`

Gere \`SESSION_SECRET\` com \`openssl rand -hex 32\`. Para \`ADMIN_TOTP_SECRET\`, gere um segredo Base32 aleatório de pelo menos 20 bytes com um gerenciador de senhas confiável ou ferramenta local confiável. Não reutilize o segredo de outro serviço.

## Configurar o aplicativo 2FA

Adicione uma conta manualmente no Google Authenticator, Microsoft Authenticator ou outro app TOTP usando:
- Tipo: baseado em tempo (TOTP)
- Algoritmo: SHA-1
- Dígitos: 6
- Período: 30 segundos
- Segredo: o valor de \`ADMIN_TOTP_SECRET\`

Guarde o segredo de recuperação em local seguro. O código muda a cada 30 segundos.

## Ativar e testar

1. Salve as variáveis de ambiente no Vercel.
2. Faça um novo deployment de produção para que as funções recebam os valores.
3. Abra \`https://portifolio-peach-ten-22.vercel.app/admin.html\`.
4. Entre com a senha e o código atual do autenticador.
5. Edite a apresentação e/ou os atalhos do Launchpad e salve. A gravação cria um commit em \`content.json\`; o Vercel iniciará uma nova publicação.

O token do GitHub fica somente no ambiente server-side do Vercel. Nunca use um token com permissão ampla se um token limitado ao repositório for suficiente.

## Limitação atual

O painel edita a apresentação principal e os atalhos do Launchpad. Outras seções do portfólio continuam sendo editadas no código até serem adicionadas ao editor. Cada salvamento cria um commit no GitHub e inicia um deployment; não é uma atualização instantânea de banco de dados.
