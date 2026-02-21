# MCP Server for Foundry VTT

Este é um servidor Model Context Protocol (MCP) para integrar agentes de inteligência artificial (LLMs) com o seu mundo do Foundry VTT.

Ele foi desenhado para interagir externamente com o Foundry VTT usando módulos de API REST (como o Foundry VTT REST API), expondo parâmetros altamente tipados e validados pelo `zod`.

## Ferramentas Disponíveis (Tools)

O Assistente LLM passa a ter a capacidade de usar as seguintes ferramentas no seu Foundry VTT:
- **`create_character`**: Cria atores (personagens ou NPCs) baseados em nome, tipo, biografia e atributos de ficha.
- **`create_scene`**: Gera cenas passando nome, largura, altura e imagem de background (`backgroundUrl`).
- **`create_item`**: Arquitetado para fabricar Itens (armas, talentos, magias etc.), com nome, tipo e descrição embutida.
- **`create_note`**: Transcreve blocos de texto ou HTML diretamente como novas Notas/Journal Entries.

## Pré-requisitos

1. **Foundry VTT v13** (ou outra compatível).
2. Um módulo **API REST** instalado e ativo no seu mundo (como o "Foundry VTT REST API").
3. Node.js v18 ou superior.

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie ou edite um arquivo `.env` na raiz do projeto configurando as credenciais de acesso para a API REST do Foundry:
   ```env
   FOUNDRY_API_URL=http://localhost:30000/api
   FOUNDRY_API_KEY=sua-chave-api-do-modulo-rest
   ```

3. (Opcional) Faça a compilação do TypeScript se for alterar algo no código:
   ```bash
   npm run build
   ```

## Integrando no Claude Desktop / Cursor / Outros MCP Clients

Adicione a configuração do Servidor MCP como `stdio` apontando para o binário compilado no Node. Exemplo (`mcp.json` ou setup respectivo):

```json
{
  "mcpServers": {
    "foundry-vtt": {
      "command": "node",
      "args": ["d:/code/mcp-foundry-vtt/build/index.js"],
      "env": {
        "FOUNDRY_API_URL": "http://localhost:30000/api",
        "FOUNDRY_API_KEY": "sua-chave-api"
      }
    }
  }
}
```

## Contribuindo e Modificando Modelos

A integração foi feita simulando os schemas de sistema mais primitivos (do pacote genérico). A forma como "Actor", "Item", "Scene" operam pode variar a depender do sistema rodando no seu Foundry (ex: dnd5e, pf2e). Você pode editar a pasta `src/tools.ts` e modificar a conversão de `payload.system` para se ajustar ao seu uso customizado.
