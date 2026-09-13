import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outputDir = new URL('.', import.meta.url);
const reference = JSON.parse(await fs.readFile(new URL('../../backend/data/municipios.json', import.meta.url), 'utf8'));
const names = ['São Luís', 'Imperatriz', 'Cidelândia', 'Açailândia', 'João Lisboa', 'Davinópolis'];
const counts = [12, 8, 3, 6, 4, 2];
const headers = ['municipio', 'estado', 'latitude', 'longitude', 'data_notificacao', 'classificacao_operacional', 'casos_novos'];
const rows = names.map((name, index) => {
  const municipality = reference.find(item => item.nome === name && item.uf === 'MA');
  if (!municipality) throw new Error(`Coordenadas não encontradas: ${name}`);
  return [name, 'MA', municipality.latitude, municipality.longitude, new Date('2025-03-15T00:00:00Z'), index % 2 ? 'PB' : 'MB', counts[index]];
});
const workbook = Workbook.create();
const data = workbook.worksheets.add('Dados');
data.showGridLines = false;
data.getRange('A1:G7').values = [headers, ...rows];
data.getRange('A1:G7').format.font = { name: 'Arial', size: 11, color: '#243447' };
data.getRange('A1:G7').format.rowHeight = 28;
data.getRange('A1:G1').format = { fill: '#18384A', font: { name: 'Arial', size: 11, bold: true, color: '#FFFFFF' }, rowHeight: 32 };
for (const [column, width] of [['A', 23], ['B', 10], ['C', 17], ['D', 18], ['E', 22], ['F', 32], ['G', 18]]) {
  data.getRange(`${column}1:${column}7`).format.columnWidth = width;
}
data.getRange('C2:D7').setNumberFormat('0.0000000');
data.getRange('E2:E7').setNumberFormat('yyyy-mm-dd');
data.getRange('G2:G7').setNumberFormat('0');
data.getRange('C2:D7').format.fill = '#FFF5D6';
data.getRange('F2:F7').dataValidation = { rule: { type: 'list', values: ['PB', 'MB'] } };
data.tables.add('A1:G7', true, 'RegistrosExemplo');

const instructions = workbook.worksheets.add('Como preencher');
instructions.showGridLines = false;
instructions.getRange('A1:B12').values = [
  ['Campo ou etapa', 'Orientação'],
  ['Dados de exemplo', 'Contagens fictícias para testar o mapa. Não são notificações reais.'],
  ['Como importar', 'Salve este Excel e selecione-o em Importar dados. Abra o painel e limpe os filtros.'],
  ['Resultado esperado', 'Seis pontos no Maranhão, 35 casos novos e 100% dos casos localizados.'],
  ['municipio / estado', 'Informe o nome do município e a UF em duas letras, por exemplo Imperatriz e MA.'],
  ['latitude / longitude', 'Preencha as duas coordenadas da localidade correta, em graus decimais. Preserve os sinais negativos.'],
  ['Origem das coordenadas', 'Referência municipal local do projeto. Os pontos representam localidades, não endereços de pacientes.'],
  ['data_notificacao', 'Use uma data válida com ano. Neste exemplo: 15/03/2025, exibida como 2025-03-15.'],
  ['classificacao_operacional', 'PB = paucibacilar. MB = multibacilar. Use a classificação do seu registro.'],
  ['casos_novos', 'Número inteiro não negativo. Localidades com zero casos novos não aparecem como pontos.'],
  ['Estrutura', 'Mantenha Dados como primeira aba, os cabeçalhos na linha 1 e somente registros abaixo. Não acrescente uma linha de total.'],
  ['Se não aparecer', 'Confira os filtros, as duas coordenadas e os avisos de importação. Só o nome pode não constar na referência parcial do sistema.'],
];
instructions.getRange('A1:B12').format.font = { name: 'Arial', size: 11, color: '#243447' };
instructions.getRange('A1:B12').format.rowHeight = 43;
instructions.getRange('A1:A12').format.columnWidth = 30;
instructions.getRange('B1:B12').format.columnWidth = 105;
instructions.getRange('A1:B12').format.wrapText = true;
instructions.getRange('A1:B12').format.verticalAlignment = 'center';
instructions.getRange('A1:B1').format = { fill: '#18384A', font: { name: 'Arial', size: 11, bold: true, color: '#FFFFFF' }, rowHeight: 30 };
workbook.recalculate();
console.log((await workbook.inspect({ kind: 'table', range: 'Dados!A1:G7', include: 'values', tableMaxRows: 7, tableMaxCols: 7, maxChars: 1800 })).ndjson);
const file = await SpreadsheetFile.exportXlsx(workbook);
await file.save(new URL('exemplo_mapa_com_coordenadas.xlsx', outputDir).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
for (const [sheetName, range, filename] of [['Dados', 'A1:G7', 'dados.png'], ['Como preencher', 'A1:B12', 'instrucoes.png']]) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(new URL(filename, outputDir), new Uint8Array(await preview.arrayBuffer()));
}
