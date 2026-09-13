# Vigia Saúde

Protótipo para hackathon de saúde que transforma planilhas de hanseníase em mapas, gráficos e indicadores exploratórios para apoiar a análise territorial.

## Executar

Requisitos: Python 3.10+ e Node.js compatível com as dependências do projeto (validado neste ambiente com Python 3.12 e Node.js 24).

Em um terminal:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Abra http://localhost:5173. A documentação da API fica em http://localhost:8000/docs.

No Windows, use `npm.cmd` se a política do PowerShell bloquear `npm.ps1`. Se `python` apontar para o atalho da Microsoft Store, use o caminho da instalação real ou `py -3.12`.

## Demonstração em três minutos

1. **Problema (30 s):** planilhas dispersas dificultam a leitura territorial e a preparação de uma análise pela equipe.
2. **Entrada (30 s):** clique em **Explorar demonstração**. A API gera uma planilha sintética com 72 registros, seis localidades do Maranhão e seis meses de 2025. Ela passa pelo mesmo processamento de um upload.
3. **Território (60 s):** abra o painel, consulte um ponto, desligue a camada de calor e filtre um município. Mostre a cobertura geográfica e a atualização dos gráficos.
4. **Interpretação (30 s):** abra os sinais exploratórios, explique seus limiares de demonstração e consulte as observações de qualidade da importação.
5. **Próximos passos (30 s):** validar a utilidade com profissionais de vigilância, ampliar a referência geográfica e implementar persistência, controle de acesso e indicadores com denominadores adequados.

Os dados de demonstração são identificados no painel. Uma importação bem-sucedida substitui a base em memória para todos os clientes; uma importação inválida preserva a base anterior.

## Planilhas

### Dashboard municipal para apresentação

O painel inclui uma fila de análise de UBS, ordenada por casos novos ou pela presença de dois tipos de sinais registrados (menores de 15 anos e grau 2). A ordenação é exploratória e explícita; não estima risco nem recomenda automaticamente alocação de recursos. O botão **Analisar UBS** aplica unidade, localidade e UF aos indicadores e ao mapa. Unidades são agrupadas por nome + localidade + UF; a base precisa informar a coluna `unidade` para habilitar essa comparação.

A leitura territorial mostra a concentração nas três localidades com maior volume, a cobertura dos casos no mapa e uma tabela pesquisável, com seleção por clique e exportação CSV do recorte e da busca. Localidades sem coordenadas continuam na tabela. O gráfico temporal alterna entre valores por período e acumulados no recorte. O **Modo apresentação** oculta a navegação e recolhe os filtros, mantendo o recorte visível e permitindo reabrir os controles.

Roteiro para a banca: apresentar a base → comparar UBS e explicar o critério → analisar uma unidade → explorar o mapa e os períodos → limpar o recorte → mostrar lacunas de localização. Para justificar decisões de recursos, a gestão ainda precisa considerar capacidade das equipes, população atendida e validação dos registros.

Verificação desta atualização: TypeScript, build de produção e renderização estática com cenários de agregação, localidades homônimas em UFs distintas, cobertura parcial, base vazia e unidades ausentes. A interação e o layout em navegador continuam pendentes de validação manual.

Aceita `.xlsx` e `.xls`, até 10 MB. Arquivos XLS dependem de `xlrd`, incluído em `requirements.txt`. Use dados agregados sem identificadores pessoais.

Em arquivos com várias abas, a importação identifica as abas com município ou unidade e contagens de casos. Prioriza uma aba com latitude e longitude; em caso de empate, usa a primeira na ordem do arquivo. O nome da aba escolhida aparece nas observações da importação. As outras abas não são somadas, evitando duplicação entre dados originais, dados preparados e indicadores. No arquivo do hackathon, isso seleciona **Dados Leaflet** em vez de **Dados Originais**. Quando só existe unidade, ela é usada como localidade e as coordenadas fornecidas posicionam o ponto.

| Campo | Uso |
|---|---|
| `municipio` | Localidade; aceita aliases com acentos e espaços. Se ausente, `unidade` serve como agrupador, mas não implica uma localização municipal. |
| `estado` | UF. Pode ser inferida somente quando o nome corresponde a uma única entrada da referência local. |
| `data_notificacao` | Preferencialmente data ISO, como `2025-03-15`. |
| `bimestre` | Alternativa à data; prefira informar o ano, como `2º bimestre 2025`. |
| `casos_novos` | Contagem inteira não negativa; pode ser derivada de PB + MB quando ausente. |
| `classificacao_operacional` | PB ou MB no formato detalhado. Ausência não é tratada como PB. |
| `pb`, `mb` | Contagens do formato agregado. |
| `latitude`, `longitude` | Coordenadas de referência opcionais; aceitam decimal com vírgula. |

Campos adicionais: bairro, unidade, faixa etária, sexo, acompanhamento, formas clínicas, menores de 15 anos e grau de incapacidade 2.

Registros sem localidade ou com datas inválidas são descartados e contabilizados no retorno. A importação é rejeitada quando não restam registros válidos. Ausência de data e de bimestre mantém a convenção legada de 2000; bimestres sem ano também usam 2000 como referência interna e recebem uma observação visível. Informe o ano antes de interpretar tendências.

Em bases agregadas, o filtro PB/MB fica desabilitado: selecionar uma classificação não permite atribuir corretamente os demais indicadores da mesma linha a ela. O gráfico continua mostrando as contagens PB/MB. Divergências entre PB + MB e casos novos são sinalizadas, preservando os números originais.

## Mapa e indicadores

- Altura explícita e observação de redimensionamento corrigem o mapa vazio e mantêm o Leaflet sincronizado com o layout.
- Coordenadas válidas da planilha têm prioridade. Na ausência delas, o sistema procura nome normalizado e UF na referência local.
- A referência incluída contém **39 localidades**. Não representa cobertura nacional completa; correspondências ambíguas ou parciais não recebem coordenadas inventadas.
- Coordenadas inválidas e localidades não resolvidas são excluídas do mapa, mas seus casos continuam nos indicadores. O painel mostra a cobertura.
- O tamanho dos pontos e a camada de calor usam **casos novos**. A escala de calor é relativa ao recorte, não mede incidência nem risco individual.
- O total geral soma casos novos e acompanhamento, conforme o modelo legado; não representa necessariamente pessoas únicas.
- Municípios com casos são contados por município + UF, somente quando a contagem de casos novos é positiva.
- A variação mensal compara o último mês com o anterior apenas quando ambos têm registros e a base anterior é positiva. Bases bimestrais recebem “sem meses comparáveis”.
- Os sinais usam limiares exploratórios do protótipo. Não são um protocolo validado, não confirmam surtos e não substituem avaliação profissional. Flags de presença não são convertidas em contagens de pessoas.
- A proporção exploratória de grau 2 usa todos os casos novos como denominador; não equivale automaticamente a indicadores oficiais que dependem da informação sobre avaliação do grau.

Referências para validação técnica e epidemiológica: [Leaflet: dimensão do mapa](https://leafletjs.com/examples/quick-start/index.html), [Leaflet: invalidateSize](https://leafletjs.com/reference.html#map-invalidatesize), [Ministério da Saúde: indicadores de hanseníase](https://indicadoreshanseniase.aids.gov.br/), [Ministério da Saúde: situação epidemiológica](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/h/hanseniase/situacao-epidemiologica). A referência municipal local preexistente deve ter sua procedência e atualização verificadas antes de uso operacional.

## Arquitetura e configuração

- `frontend/src/components/Upload.tsx`: entrada, validação inicial e demonstração.
- `frontend/src/components/Dashboard.tsx`: filtros, estados de carregamento, recuperação de erros e indicadores.
- `frontend/src/components/HeatMap.tsx`: mapa, cobertura e controles.
- `backend/services/excel_parser.py`: normalização e validação.
- `backend/services/geocoding.py`: resolução local de coordenadas.
- `backend/services/analytics.py`: agregações e sinais exploratórios.
- `backend/services/data_store.py`: armazenamento compartilhado em memória.

O frontend usa `/api` por padrão, encaminhado pelo Vite para `http://127.0.0.1:8000`. Isso cobre todos os endpoints, inclusive bairros, unidades e demonstração. Para outro destino, copie `frontend/.env.example` para `.env.local` e configure `VITE_API_URL` antes de iniciar ou compilar.

Em hospedagem estática, configure um proxy reverso para `/api` e fallback das rotas para `index.html`, ou defina a URL pública da API no build. Configure `CORS_ORIGINS` no backend com as origens permitidas separadas por vírgulas. A configuração padrão permite as duas origens locais de desenvolvimento.

| Método | Rota | Função |
|---|---|---|
| POST | `/upload` | Importa Excel; formulário `file` e flag `demonstracao` opcional |
| GET | `/exemplo` | Gera planilha sintética sem alterar a base |
| GET | `/status` | Estado da base, nome do arquivo, flag de demonstração e observações |
| GET | `/casos` | Registros filtrados |
| GET | `/bairros`, `/unidades` | Opções de filtros |
| GET | `/analytics/resumo` | Resumo e séries |
| GET | `/analytics/mapa` | Pontos agregados |
| GET | `/analytics/alertas` | Sinais exploratórios |

Filtros: estado, município, bairro, unidade, id da unidade, bimestre, forma predominante, flags de menores de 15/grau 2, classificação e datas.

## Verificação

```powershell
cd frontend
npm run typecheck
npm run build
```

O projeto não possui suíte automatizada ou ESLint configurado. O comando anterior de lint chamava uma dependência inexistente e foi substituído por `typecheck`. As alterações foram verificadas com compilação e verificações de integração em uma instância local isolada.

A inspeção visual em navegador não foi executada nesta sessão porque a ferramenta de navegação não encontrou um navegador disponível. O roteiro abaixo cobre essa verificação pendente. O suporte XLS foi declarado nas dependências; a integração foi exercitada com XLSX.

Roteiro manual: importar demonstração, abrir mapa, consultar ponto, alternar calor, centralizar, filtrar município, limpar filtros, experimentar um recorte vazio, importar arquivo inválido e conferir a preservação da base. Repetir em tela estreita e após redimensionar a janela.

## Limites antes de um piloto real

Este é um protótipo de demonstração. A base é compartilhada, sem autenticação, e desaparece ao reiniciar o processo. Não execute múltiplos workers com armazenamento em memória. O mapa de fundo depende de acesso à internet (OpenStreetMap); coordenadas e contagens não são enviadas a um serviço de geocodificação.

Para um piloto: autenticação e autorização, isolamento por organização, banco de dados, trilha de auditoria, governança dos dados de saúde, referência geográfica revisada, testes automatizados e validação dos indicadores com a equipe responsável.
