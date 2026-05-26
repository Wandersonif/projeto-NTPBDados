# Documentação Técnica - NTPBDados

## 1. Modelo de Dados (MER - Conceitual)

### Entidades Principais:

1.  **Categoria**
    *   `id` (PK): Inteiro, Serial
    *   `nome`: String, Único
    *   `descricao`: String

2.  **Produto**
    *   `id` (PK): Inteiro, Serial
    *   `nome`: String
    *   `preco`: Decimal
    *   `categoria_id` (FK): Referência a Categoria
    *   `estoque`: Inteiro

3.  **Venda**
    *   `id` (PK): Inteiro, Serial
    *   `data`: Timestamp (default NOW)
    *   `total`: Decimal

4.  **Item_Venda** (Tabela de Relacionamento N:N entre Venda e Produto)
    *   `id` (PK): Inteiro, Serial
    *   `venda_id` (FK): Referência a Venda
    *   `produto_id` (FK): Referência a Produto
    *   `quantidade`: Inteiro
    *   `preco_unitario`: Decimal (valor no momento da venda)

## 2. Diagrama de Relacionamento (Mermaid)

```mermaid
erDiagram
    CATEGORIA ||--o{ PRODUTO : "contém"
    PRODUTO ||--o{ ITEM_VENDA : "está em"
    VENDA ||--o{ ITEM_VENDA : "possui"

    CATEGORIA {
        int id PK
        string nome
        string descricao
    }
    PRODUTO {
        int id PK
        string nome
        decimal preco
        int categoria_id FK
        int estoque
    }
    VENDA {
        int id PK
        timestamp data
        decimal total
    }
    ITEM_VENDA {
        int id PK
        int venda_id FK
        int produto_id FK
        int quantidade
        decimal preco_unitario
    }
```

## 3. Endpoints Previstos (Backend)

*   `GET /api/dashboard/stats`: Retorna totais de vendas, ticket médio e produtos em destaque.
*   `GET /api/dashboard/vendas-por-periodo`: Dados para gráfico de linha (evolução temporal).
*   `GET /api/dashboard/vendas-por-categoria`: Dados para gráfico de pizza/rosca.
*   `GET /api/produtos`: Listagem e filtros.
*   `POST /api/vendas`: Registro de nova venda.
