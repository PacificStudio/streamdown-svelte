// @ts-nocheck
export type TableBenchmarkCase = {
	group: string;
	formatter: 'csv' | 'tsv' | 'markdown';
	name: string;
	compare?: boolean;
	table: {
		headers: string[];
		rows: string[][];
	};
};

const simpleTable = {
	headers: ['Name', 'Age', 'City'],
	rows: [
		['John', '30', 'NYC'],
		['Jane', '25', 'LA']
	]
};

const largeTable = {
	headers: ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP'],
	rows: Array.from({ length: 100 }, (_, index) => [
		String(index),
		`User${index}`,
		`user${index}@example.com`,
		`555-${String(index).padStart(4, '0')}`,
		`${index} Main St`,
		`City${index}`,
		'ST',
		String(10000 + index)
	])
};

const tableWithComplexData = {
	headers: ['Product', 'Price', 'Description', 'Stock'],
	rows: [
		['Widget A', '$19.99', 'A cool widget with "quotes"', '100'],
		['Gadget B', '$29.99', 'Has, commas, in text', '50'],
		['Tool C', '$39.99', 'Line\nbreaks are tricky', '25']
	]
};

const wideTable = {
	headers: Array.from({ length: 20 }, (_, index) => `Col${index}`),
	rows: [Array.from({ length: 20 }, (_, index) => `Val${index}`)]
};

const mediumTable = {
	headers: ['A', 'B', 'C', 'D', 'E'],
	rows: Array.from({ length: 50 }, (_, index) => [
		`${index}a`,
		`${index}b`,
		`${index}c`,
		`${index}d`,
		`${index}e`
	])
};

const tableWithEmptyCells = {
	headers: ['A', 'B', 'C'],
	rows: [
		['1', '', '3'],
		['', '2', '']
	]
};

const tableWithSpecialChars = {
	headers: ['Text', 'Value'],
	rows: [['Has | pipe', '123']]
};

export const tableBenchmarkCases: TableBenchmarkCase[] = [
	{
		group: 'tableDataToCSV',
		formatter: 'csv',
		name: 'simple table (3x3)',
		table: simpleTable,
		compare: true
	},
	{
		group: 'tableDataToCSV',
		formatter: 'csv',
		name: 'large table (100 rows x 8 cols)',
		table: largeTable,
		compare: true
	},
	{
		group: 'tableDataToCSV',
		formatter: 'csv',
		name: 'table with complex data',
		table: tableWithComplexData,
		compare: true
	},
	{
		group: 'tableDataToCSV',
		formatter: 'csv',
		name: 'wide table (20 columns)',
		table: wideTable
	},
	{
		group: 'tableDataToTSV',
		formatter: 'tsv',
		name: 'simple table (3x3)',
		table: simpleTable,
		compare: true
	},
	{
		group: 'tableDataToTSV',
		formatter: 'tsv',
		name: 'large table (100 rows x 8 cols)',
		table: largeTable,
		compare: true
	},
	{
		group: 'tableDataToTSV',
		formatter: 'tsv',
		name: 'table with complex data',
		table: tableWithComplexData,
		compare: true
	},
	{
		group: 'tableDataToTSV',
		formatter: 'tsv',
		name: 'wide table (20 columns)',
		table: wideTable
	},
	{
		group: 'tableDataToMarkdown',
		formatter: 'markdown',
		name: 'simple table (3x3)',
		table: simpleTable
	},
	{
		group: 'tableDataToMarkdown',
		formatter: 'markdown',
		name: 'large table (100 rows x 8 cols)',
		table: largeTable,
		compare: true
	},
	{
		group: 'tableDataToMarkdown',
		formatter: 'markdown',
		name: 'table with complex data',
		table: tableWithComplexData
	},
	{
		group: 'tableDataToMarkdown',
		formatter: 'markdown',
		name: 'wide table (20 columns)',
		table: wideTable,
		compare: true
	},
	{
		group: 'Format conversion comparison',
		formatter: 'csv',
		name: 'CSV conversion (50 rows)',
		table: mediumTable
	},
	{
		group: 'Format conversion comparison',
		formatter: 'tsv',
		name: 'TSV conversion (50 rows)',
		table: mediumTable
	},
	{
		group: 'Format conversion comparison',
		formatter: 'markdown',
		name: 'Markdown conversion (50 rows)',
		table: mediumTable
	},
	{
		group: 'Table data edge cases',
		formatter: 'csv',
		name: 'table with empty cells (CSV)',
		table: tableWithEmptyCells
	},
	{
		group: 'Table data edge cases',
		formatter: 'tsv',
		name: 'table with empty cells (TSV)',
		table: tableWithEmptyCells
	},
	{
		group: 'Table data edge cases',
		formatter: 'csv',
		name: 'table with special chars (CSV)',
		table: tableWithSpecialChars
	},
	{
		group: 'Table data edge cases',
		formatter: 'markdown',
		name: 'table with special chars (Markdown)',
		table: tableWithSpecialChars,
		compare: true
	}
];
