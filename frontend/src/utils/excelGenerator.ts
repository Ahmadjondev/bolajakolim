import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { FormData } from '../types';
import {
  calculateSalaryTotals,
  calculateInventoryTotals,
  calculateRawMaterialsTotals,
  calculateOtherExpensesTotals,
  calculateGrandTotals,
  calculateTannarx,
  calculateDavrXarajatlari,
  calculateSotishRejasiByYear,
  calculateMoliyaviyXisobot,
  SOCIAL_TAX_RATE,
} from './calculations';

// Stil konstantalari
const headerStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 11 },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
};

const cellStyle: Partial<ExcelJS.Style> = {
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
};

const titleStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 14 },
  alignment: { horizontal: 'center', vertical: 'middle' },
};

const subtotalStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, italic: true },
  alignment: { horizontal: 'right', vertical: 'middle' },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
};

export async function generateExcel(data: FormData): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Xarajatlar Smetasi Generator';
    workbook.created = new Date();

    // Jami varag'i
    createJamiSheet(workbook, data);
    
    // Ish haqi varag'i
    createIshHaqiSheet(workbook, data);
    
    // Inventar varag'i
    createInventarSheet(workbook, data);
    
    // Xom ashyo varag'i
    createXomAshyoSheet(workbook, data);
    
    // Boshqa xarajatlar varag'i
    createBoshqaXarajatlarSheet(workbook, data);
    
    // Tannarx varag'i
    createTannarxSheet(workbook, data);

    // Davr xarajatlari varag'i
    createDavrXarajatlariSheet(workbook, data);

    // Sotish rejasi varag'i
    createSotishRejasiSheet(workbook, data);

    // Moliyaviy xisobot varag'i
    createMoliyaviyXisobotSheet(workbook, data);

    // Faylni saqlash - native download
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = buildExcelFileName(data.projectInfo.projectName);
    saveAs(blob, filename);
  } catch (error) {
    console.error('Excel generation error:', error);
    throw error;
  }
}

function buildExcelFileName(projectName: string): string {
  const fallback = 'Xarajatlar_smetasi';
  const trimmed = projectName?.trim() ?? '';
  const sanitized = trimmed
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim();
  const base = sanitized || fallback;
  return base.toLowerCase().endsWith('.xlsx') ? base : `${base}.xlsx`;
}

function createJamiSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Jami');
  const totals = calculateGrandTotals(data);

  // Sarlavha
  sheet.mergeCells('A1:E1');
  const descCell = sheet.getCell('A1');
  descCell.value = `Loyihaning xarajatlar smetasi (xarajatlar smetasi loyihaning umumiy muddatiga to'ldirilishi va xarajatlarni asoslovchi hisob-kitoblar (jadvallar) ilova qilinishi shart. Agar birgalikda moliyalashtirish ko'zda tutilgan bo'lsa, birgalikda moliyalashtirish xarajatlari tarkibi moliyalashtirish manbasiga nisbatan alohida ko'rsatilishi shart).`;
  descCell.style = { font: { size: 10, italic: true }, alignment: { wrapText: true } };
  sheet.getRow(1).height = 50;

  // Loyiha nomi
  sheet.mergeCells('A4:E4');
  const titleCell = sheet.getCell('A4');
  titleCell.value = 'XARAJATLAR SMETASI';
  titleCell.style = titleStyle;

  sheet.mergeCells('A5:E5');
  const projectCell = sheet.getCell('A5');
  projectCell.value = `${data.projectInfo.projectName} - ${data.projectInfo.organizationName}`;
  projectCell.style = { font: { bold: true, size: 12 }, alignment: { horizontal: 'center' } };

  // Jadval sarlavhasi
  const headerRow = 7;
  const headers = [
    'Xarajat turlari',
    'Vazirlik hisobidan\n(ming so\'mda)',
    'Birgalikda moliyalashtiradigan\ntashkilot hisobidan\n(ming so\'mda)',
    'Summa\n(ming so\'mda)',
    'Umumiy\nxarajatlardagi\nulushi foizda (%)',
  ];

  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.style = headerStyle;
  });
  sheet.getRow(headerRow).height = 45;

  // Ma'lumotlar
  const expenses = [
    {
      name: 'Ish haqi fondi',
      vazirlik: totals.vazirlik.ishHaqiFondi,
      tashkilot: totals.tashkilot.ishHaqiFondi,
    },
    {
      name: 'Ijtimoiy soliq',
      vazirlik: totals.vazirlik.ijtimoiySoliq,
      tashkilot: totals.tashkilot.ijtimoiySoliq,
    },
    {
      name: 'Xomashyo va materiallarni sotib olish bilan bog\'liq xarajatlar',
      vazirlik: totals.vazirlik.xomashyo,
      tashkilot: totals.tashkilot.xomashyo,
    },
    {
      name: 'Asbob-uskuna, texnika va jihozlarni xarid qilish xarajatlari',
      vazirlik: totals.vazirlik.inventar,
      tashkilot: totals.tashkilot.inventar,
    },
    {
      name: 'Boshqa xarajatlar',
      vazirlik: totals.vazirlik.boshqaXarajatlar,
      tashkilot: totals.tashkilot.boshqaXarajatlar,
    },
  ];

  let row = headerRow + 1;
  let totalVazirlik = 0;
  let totalTashkilot = 0;

  expenses.forEach((exp) => {
    const summa = exp.vazirlik + exp.tashkilot;
    const vazirlikK = exp.vazirlik / 1000;
    const tashkilotK = exp.tashkilot / 1000;
    const summaK = summa / 1000;
    const percent = totals.grandTotal > 0 ? ((summa / totals.grandTotal) * 100).toFixed(1) : '0.0';

    totalVazirlik += exp.vazirlik;
    totalTashkilot += exp.tashkilot;

    sheet.getCell(row, 1).value = exp.name;
    sheet.getCell(row, 1).style = { ...cellStyle, alignment: { horizontal: 'left', wrapText: true } };
    
    sheet.getCell(row, 2).value = Math.round(vazirlikK);
    sheet.getCell(row, 2).style = cellStyle;
    
    sheet.getCell(row, 3).value = Math.round(tashkilotK);
    sheet.getCell(row, 3).style = cellStyle;
    
    sheet.getCell(row, 4).value = Math.round(summaK);
    sheet.getCell(row, 4).style = cellStyle;
    
    sheet.getCell(row, 5).value = `${percent}%`;
    sheet.getCell(row, 5).style = cellStyle;

    row++;
  });

  // Jami qator
  const grandVazirlikK = totalVazirlik / 1000;
  const grandTashkilotK = totalTashkilot / 1000;
  const grandTotalK = (totalVazirlik + totalTashkilot) / 1000;

  sheet.getCell(row, 1).value = 'Jami xarajatlar:';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 2).value = Math.round(grandVazirlikK);
  sheet.getCell(row, 2).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 3).value = Math.round(grandTashkilotK);
  sheet.getCell(row, 3).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 4).value = Math.round(grandTotalK);
  sheet.getCell(row, 4).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 5).value = '100.0%';
  sheet.getCell(row, 5).style = { ...cellStyle, font: { bold: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 45;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 30;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 18;
}

function createIshHaqiSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Ish haqi');
  const salaryTotals = calculateSalaryTotals(data.salary);

  // Sarlavha
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Mehnatga haq to\'lash xarajatlari';
  titleCell.style = { ...titleStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } } };
  sheet.getRow(1).height = 25;

  // Jadval sarlavhasi
  const headerRow = 3;
  const headers = [
    '№',
    'Lavozimi',
    'Ishchilar soni',
    'Bir ishchining\nish haqi\n(oyda)',
    'Jami oylik ish\nhaqi\n(ming so\'mda)',
    'Ish davomiyligi\n(oylarda)',
    'Jami\n(ming so\'mda)',
    'Moliyalashtirish manbasi',
  ];

  // Kichik sarlavhalar
  sheet.mergeCells('A3:A4');
  sheet.mergeCells('B3:B4');
  sheet.mergeCells('C3:C4');
  sheet.mergeCells('D3:D4');
  sheet.mergeCells('E3:E4');
  sheet.mergeCells('F3:F4');
  sheet.mergeCells('G3:G4');
  sheet.mergeCells('H3:I3');

  headers.slice(0, 7).forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.style = headerStyle;
  });

  sheet.getCell('H3').value = 'Moliyalashtirish manbasi';
  sheet.getCell('H3').style = headerStyle;
  
  sheet.getCell('H4').value = 'Vazirlik hisobidan\n(ming so\'mda)';
  sheet.getCell('H4').style = headerStyle;
  
  sheet.getCell('I4').value = 'Tashkilot hisobidan\n(ming so\'mda)';
  sheet.getCell('I4').style = headerStyle;

  sheet.getRow(3).height = 30;
  sheet.getRow(4).height = 40;

  let row = 5;

  // Ma'muriy-boshqaruv xodimlari
  sheet.mergeCells(`A${row}:I${row}`);
  sheet.getCell(row, 1).value = 'Ma\'muriy-boshqaruv xodimlari:';
  sheet.getCell(row, 1).style = { font: { bold: true }, alignment: { horizontal: 'left' } };
  row++;

  data.salary.managementStaff.forEach((emp, idx) => {
    const total = emp.monthlySalary * emp.count * emp.durationMonths;
    const monthlyTotal = emp.monthlySalary * emp.count;
    const isVazirlik = emp.financingSource === 'vazirlik';

    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = emp.position;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left' } };
    sheet.getCell(row, 3).value = emp.count;
    sheet.getCell(row, 3).style = cellStyle;
    sheet.getCell(row, 4).value = Math.round(emp.monthlySalary / 1000);
    sheet.getCell(row, 4).style = cellStyle;
    sheet.getCell(row, 5).value = Math.round(monthlyTotal / 1000);
    sheet.getCell(row, 5).style = cellStyle;
    sheet.getCell(row, 6).value = emp.durationMonths;
    sheet.getCell(row, 6).style = cellStyle;
    sheet.getCell(row, 7).value = Math.round(total / 1000);
    sheet.getCell(row, 7).style = cellStyle;
    sheet.getCell(row, 8).value = isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 8).style = cellStyle;
    sheet.getCell(row, 9).value = !isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 9).style = cellStyle;
    row++;
  });

  // Ma'muriy jami
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Jami ma\'muriy-boshqaruv xodimlari ish haqi fondi';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true, italic: true } };
  sheet.getCell(row, 7).value = Math.round(salaryTotals.managementTotal / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 8).value = Math.round(salaryTotals.managementVazirlik / 1000);
  sheet.getCell(row, 8).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 9).value = Math.round(salaryTotals.managementTashkilot / 1000);
  sheet.getCell(row, 9).style = { ...cellStyle, font: { bold: true } };
  row++;

  // Ma'muriy ijtimoiy soliq
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Ijtimoiy soliq';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { italic: true } };
  sheet.getCell(row, 7).value = Math.round(salaryTotals.managementSocialTax / 1000);
  sheet.getCell(row, 7).style = cellStyle;
  sheet.getCell(row, 8).value = Math.round((salaryTotals.managementVazirlik * SOCIAL_TAX_RATE) / 1000);
  sheet.getCell(row, 8).style = cellStyle;
  sheet.getCell(row, 9).value = Math.round((salaryTotals.managementTashkilot * SOCIAL_TAX_RATE) / 1000);
  sheet.getCell(row, 9).style = cellStyle;
  row++;

  // Ishlab chiqarish xodimlari
  sheet.mergeCells(`A${row}:I${row}`);
  sheet.getCell(row, 1).value = 'Ishlab chiqarish xodimlari:';
  sheet.getCell(row, 1).style = { font: { bold: true }, alignment: { horizontal: 'left' } };
  row++;

  data.salary.productionStaff.forEach((emp, idx) => {
    const total = emp.monthlySalary * emp.count * emp.durationMonths;
    const monthlyTotal = emp.monthlySalary * emp.count;
    const isVazirlik = emp.financingSource === 'vazirlik';

    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = emp.position;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left' } };
    sheet.getCell(row, 3).value = emp.count;
    sheet.getCell(row, 3).style = cellStyle;
    sheet.getCell(row, 4).value = Math.round(emp.monthlySalary / 1000);
    sheet.getCell(row, 4).style = cellStyle;
    sheet.getCell(row, 5).value = Math.round(monthlyTotal / 1000);
    sheet.getCell(row, 5).style = cellStyle;
    sheet.getCell(row, 6).value = emp.durationMonths;
    sheet.getCell(row, 6).style = cellStyle;
    sheet.getCell(row, 7).value = Math.round(total / 1000);
    sheet.getCell(row, 7).style = cellStyle;
    sheet.getCell(row, 8).value = isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 8).style = cellStyle;
    sheet.getCell(row, 9).value = !isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 9).style = cellStyle;
    row++;
  });

  // Ishlab chiqarish jami
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Jami ishlab chiqarish xodimlari ish haqi fondi';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true, italic: true } };
  sheet.getCell(row, 7).value = Math.round(salaryTotals.productionTotal / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 8).value = Math.round(salaryTotals.productionVazirlik / 1000);
  sheet.getCell(row, 8).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 9).value = Math.round(salaryTotals.productionTashkilot / 1000);
  sheet.getCell(row, 9).style = { ...cellStyle, font: { bold: true } };
  row++;

  // Ishlab chiqarish ijtimoiy soliq
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Ijtimoiy soliq';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { italic: true } };
  sheet.getCell(row, 7).value = Math.round(salaryTotals.productionSocialTax / 1000);
  sheet.getCell(row, 7).style = cellStyle;
  sheet.getCell(row, 8).value = Math.round((salaryTotals.productionVazirlik * SOCIAL_TAX_RATE) / 1000);
  sheet.getCell(row, 8).style = cellStyle;
  sheet.getCell(row, 9).value = Math.round((salaryTotals.productionTashkilot * SOCIAL_TAX_RATE) / 1000);
  sheet.getCell(row, 9).style = cellStyle;
  row++;

  // Umumiy jami
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Jami ish haqi fondi';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 7).value = Math.round(salaryTotals.totalSalary / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 8).value = Math.round((salaryTotals.managementVazirlik + salaryTotals.productionVazirlik) / 1000);
  sheet.getCell(row, 8).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 9).value = Math.round((salaryTotals.managementTashkilot + salaryTotals.productionTashkilot) / 1000);
  sheet.getCell(row, 9).style = { ...cellStyle, font: { bold: true } };
  row++;

  // Jami ijtimoiy soliq
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Jami ijtimoiy soliq';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 7).value = Math.round(salaryTotals.totalSocialTax / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 15;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 15;
  sheet.getColumn(8).width = 18;
  sheet.getColumn(9).width = 18;
}

function createInventarSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Inventar');
  const inventoryTotals = calculateInventoryTotals(data.inventory);

  // Sarlavha
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Inventar, texnika va jihozlarni xarid qilish xarajatlari';
  titleCell.style = { ...titleStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } } };
  sheet.getRow(1).height = 25;

  // Jadval sarlavhasi
  const headerRow = 3;
  sheet.mergeCells('A3:A4');
  sheet.mergeCells('B3:B4');
  sheet.mergeCells('C3:C4');
  sheet.mergeCells('D3:D4');
  sheet.mergeCells('E3:E4');
  sheet.mergeCells('F3:F4');
  sheet.mergeCells('G3:H3');

  const headers = ['№', 'Mahsulotlar nomi', 'O\'lchov\nbirligi', 'Miqdori', 'Narxi\n(ming so\'mda)', 'Summasi\n(ming\nso\'mda)'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.style = headerStyle;
  });

  sheet.getCell('G3').value = 'Moliyalashtirish manbasi';
  sheet.getCell('G3').style = headerStyle;
  sheet.getCell('G4').value = 'Vazirlik hisobidan\n(ming so\'mda)';
  sheet.getCell('G4').style = headerStyle;
  sheet.getCell('H4').value = 'Tashkilot\nhisobidan (ming\nso\'mda)';
  sheet.getCell('H4').style = headerStyle;

  sheet.getRow(3).height = 25;
  sheet.getRow(4).height = 45;

  let row = 5;

  data.inventory.forEach((item, idx) => {
    const total = item.price * item.quantity;
    const isVazirlik = item.financingSource === 'vazirlik';

    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    
    // Mahsulot nomi va link
    const nameCell = sheet.getCell(row, 2);
    nameCell.value = item.description ? `${item.name}\n(${item.description})\n${item.link}` : `${item.name}\n${item.link}`;
    nameCell.style = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };
    
    sheet.getCell(row, 3).value = item.unit;
    sheet.getCell(row, 3).style = cellStyle;
    sheet.getCell(row, 4).value = item.quantity;
    sheet.getCell(row, 4).style = cellStyle;
    sheet.getCell(row, 5).value = Math.round(item.price / 1000);
    sheet.getCell(row, 5).style = cellStyle;
    sheet.getCell(row, 6).value = Math.round(total / 1000);
    sheet.getCell(row, 6).style = cellStyle;
    sheet.getCell(row, 7).value = isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 7).style = cellStyle;
    sheet.getCell(row, 8).value = !isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 8).style = cellStyle;

    sheet.getRow(row).height = item.description || item.link ? 60 : 25;
    row++;
  });

  // Jami
  sheet.getCell(row, 1).value = '';
  sheet.getCell(row, 2).value = 'Jami:';
  sheet.getCell(row, 2).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 6).value = Math.round(inventoryTotals.total / 1000);
  sheet.getCell(row, 6).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 7).value = Math.round(inventoryTotals.vazirlik / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 8).value = Math.round(inventoryTotals.tashkilot / 1000);
  sheet.getCell(row, 8).style = { ...cellStyle, font: { bold: true } };
  row += 2;

  // Izoh
  sheet.getCell(row, 1).value = 'Izoh:';
  sheet.getCell(row, 1).style = { font: { italic: true } };
  row++;
  sheet.mergeCells(`A${row}:H${row}`);
  sheet.getCell(row, 1).value = '1. Inventar, texnika va jihozlarning texnik tavsifi va nima maqsadda ishlatilish zarurati asoslantirilishi kerak.';
  sheet.getCell(row, 1).style = { font: { italic: true }, alignment: { wrapText: true } };
  row++;
  sheet.mergeCells(`A${row}:H${row}`);
  sheet.getCell(row, 1).value = '2. Xarid qilinadigan mahsulot, ish va xizmatlar narxlarini belgilashda kamida 3 ta ishlab chiqaruvchi yoki mol yetkazib beruvchi tashkilotlarning tijorat takliflari ilova qilinishi lozim.';
  sheet.getCell(row, 1).style = { font: { italic: true }, alignment: { wrapText: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 18;
  sheet.getColumn(8).width = 18;
}

function createXomAshyoSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Xom ashyo');
  const rawMaterialsTotals = calculateRawMaterialsTotals(data.rawMaterials);

  // Sarlavha
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Xomashyo va materiallarni sotib olish xarajatlari';
  titleCell.style = { ...titleStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } } };
  sheet.getRow(1).height = 25;

  // Jadval sarlavhasi
  const headerRow = 3;
  sheet.mergeCells('A3:A4');
  sheet.mergeCells('B3:B4');
  sheet.mergeCells('C3:C4');
  sheet.mergeCells('D3:D4');
  sheet.mergeCells('E3:E4');
  sheet.mergeCells('F3:F4');
  sheet.mergeCells('G3:H3');

  const headers = ['№', 'Xomashyo nomi', 'O\'lchov\nbirligi', 'Miqdori', 'Narxi\n(ming so\'mda)', 'Summasi\n(ming\nso\'mda)'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.style = headerStyle;
  });

  sheet.getCell('G3').value = 'Moliyalashtirish manbasi';
  sheet.getCell('G3').style = headerStyle;
  sheet.getCell('G4').value = 'Vazirlik hisobidan\n(ming so\'mda)';
  sheet.getCell('G4').style = headerStyle;
  sheet.getCell('H4').value = 'Tashkilot\nhisobidan (ming\nso\'mda)';
  sheet.getCell('H4').style = headerStyle;

  sheet.getRow(3).height = 25;
  sheet.getRow(4).height = 45;

  let row = 5;

  data.rawMaterials.forEach((item, idx) => {
    const total = item.price * item.quantity;
    const isVazirlik = item.financingSource === 'vazirlik';

    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = item.name;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left' } };
    sheet.getCell(row, 3).value = item.unit;
    sheet.getCell(row, 3).style = cellStyle;
    sheet.getCell(row, 4).value = item.quantity;
    sheet.getCell(row, 4).style = cellStyle;
    sheet.getCell(row, 5).value = Math.round(item.price / 1000);
    sheet.getCell(row, 5).style = cellStyle;
    sheet.getCell(row, 6).value = Math.round(total / 1000);
    sheet.getCell(row, 6).style = cellStyle;
    sheet.getCell(row, 7).value = isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 7).style = cellStyle;
    sheet.getCell(row, 8).value = !isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 8).style = cellStyle;
    row++;
  });

  // Jami
  sheet.getCell(row, 1).value = '';
  sheet.getCell(row, 2).value = 'Jami:';
  sheet.getCell(row, 2).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 6).value = Math.round(rawMaterialsTotals.total / 1000);
  sheet.getCell(row, 6).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 7).value = Math.round(rawMaterialsTotals.vazirlik / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 8).value = Math.round(rawMaterialsTotals.tashkilot / 1000);
  sheet.getCell(row, 8).style = { ...cellStyle, font: { bold: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 18;
  sheet.getColumn(8).width = 18;
}

function createBoshqaXarajatlarSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Boshqa xar.');
  const expensesTotals = calculateOtherExpensesTotals(data.otherExpenses);

  // Sarlavha
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Boshqa xarajatlar';
  titleCell.style = { ...titleStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } } };
  sheet.getRow(1).height = 25;

  // Jadval sarlavhasi
  const headerRow = 3;
  sheet.mergeCells('A3:A4');
  sheet.mergeCells('B3:B4');
  sheet.mergeCells('C3:C4');
  sheet.mergeCells('D3:D4');
  sheet.mergeCells('E3:E4');
  sheet.mergeCells('F3:F4');
  sheet.mergeCells('G3:H3');

  const headers = ['№', 'Xarajatlar nomi', 'O\'lchov birligi', 'Miqdori', 'Narxi\n(ming so\'mda)', 'Summasi\n(ming so\'mda)'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.style = headerStyle;
  });

  sheet.getCell('G3').value = 'Moliyalashtirish manbasi';
  sheet.getCell('G3').style = headerStyle;
  sheet.getCell('G4').value = 'Vazirlik hisobidan\n(ming so\'mda)';
  sheet.getCell('G4').style = headerStyle;
  sheet.getCell('H4').value = 'Tashkilot hisobidan\n(ming so\'mda)';
  sheet.getCell('H4').style = headerStyle;

  sheet.getRow(3).height = 25;
  sheet.getRow(4).height = 45;

  let row = 5;

  // Boshqa ma'muriy xarajatlar sarlavha
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Boshqa ma\'muriy xarajatlar:';
  sheet.getCell(row, 1).style = { font: { bold: true }, alignment: { horizontal: 'left' } };
  sheet.getCell(row, 7).value = Math.round(expensesTotals.managementVazirlik / 1000);
  sheet.getCell(row, 7).style = cellStyle;
  sheet.getCell(row, 8).value = Math.round(expensesTotals.managementTashkilot / 1000);
  sheet.getCell(row, 8).style = cellStyle;
  row++;

  data.otherExpenses.managementExpenses.forEach((exp, idx) => {
    const total = exp.price * exp.quantity;
    const isVazirlik = exp.financingSource === 'vazirlik';

    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = exp.name;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left', wrapText: true } };
    sheet.getCell(row, 3).value = exp.unit;
    sheet.getCell(row, 3).style = cellStyle;
    sheet.getCell(row, 4).value = exp.quantity;
    sheet.getCell(row, 4).style = cellStyle;
    sheet.getCell(row, 5).value = Math.round(exp.price / 1000);
    sheet.getCell(row, 5).style = cellStyle;
    sheet.getCell(row, 6).value = Math.round(total / 1000);
    sheet.getCell(row, 6).style = cellStyle;
    sheet.getCell(row, 7).value = isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 7).style = cellStyle;
    sheet.getCell(row, 8).value = !isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 8).style = cellStyle;
    row++;
  });

  // Ishlab chiqarish bilan bog'liq boshqa xarajatlar sarlavha
  sheet.mergeCells(`A${row}:F${row}`);
  sheet.getCell(row, 1).value = 'Ishlab chiqarish bilan bog\'liq boshqa xarajatlar:';
  sheet.getCell(row, 1).style = { font: { bold: true }, alignment: { horizontal: 'left' } };
  sheet.getCell(row, 7).value = Math.round(expensesTotals.productionVazirlik / 1000);
  sheet.getCell(row, 7).style = cellStyle;
  sheet.getCell(row, 8).value = Math.round(expensesTotals.productionTashkilot / 1000);
  sheet.getCell(row, 8).style = cellStyle;
  row++;

  data.otherExpenses.productionExpenses.forEach((exp, idx) => {
    const total = exp.price * exp.quantity;
    const isVazirlik = exp.financingSource === 'vazirlik';

    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = exp.name;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left', wrapText: true } };
    sheet.getCell(row, 3).value = exp.unit;
    sheet.getCell(row, 3).style = cellStyle;
    sheet.getCell(row, 4).value = exp.quantity;
    sheet.getCell(row, 4).style = cellStyle;
    sheet.getCell(row, 5).value = Math.round(exp.price / 1000);
    sheet.getCell(row, 5).style = cellStyle;
    sheet.getCell(row, 6).value = Math.round(total / 1000);
    sheet.getCell(row, 6).style = cellStyle;
    sheet.getCell(row, 7).value = isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 7).style = cellStyle;
    sheet.getCell(row, 8).value = !isVazirlik ? Math.round(total / 1000) : '';
    sheet.getCell(row, 8).style = cellStyle;
    row++;
  });

  // Jami
  sheet.mergeCells(`A${row}:E${row}`);
  sheet.getCell(row, 1).value = 'Jami:';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 6).value = Math.round(expensesTotals.total / 1000);
  sheet.getCell(row, 6).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 7).value = Math.round(expensesTotals.vazirlik / 1000);
  sheet.getCell(row, 7).style = { ...cellStyle, font: { bold: true } };
  sheet.getCell(row, 8).value = Math.round(expensesTotals.tashkilot / 1000);
  sheet.getCell(row, 8).style = { ...cellStyle, font: { bold: true } };
  row += 2;

  // Izoh
  sheet.mergeCells(`A${row}:H${row}`);
  sheet.getCell(row, 1).value = 'Izoh: Boshqa xarajatlar summasi va tarkibi aniq asoslantirilishi lozim.';
  sheet.getCell(row, 1).style = { font: { italic: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 45;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 18;
  sheet.getColumn(8).width = 18;
}

function createTannarxSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Tannarx');
  const tannarx = calculateTannarx(data);

  // Izoh
  sheet.mergeCells('A1:C1');
  const noteCell = sheet.getCell('A1');
  noteCell.value = 'Mahsulot (ishlar, xizmatlar)ning ishlab chiqarish tannarxiga kiritiladigan xarajatlar tarkibi (ishlab chiqarish bilan bog\'liq moddiy xarajatlar, ishlab chiqarish xususiyatiga ega bo\'lgan mehnatga haq to\'lash xarajatlari, ishlab chiqarishga tegishli bo\'lgan ijtimoiy soliq xarajatlari, asosiy fondlar va ishlab chiqarish ahamiyatiga ega bo\'lgan nomoddiy aktivlar amortizatsiyasi va ishlab chiqarish ahamiyatiga ega bo\'lgan boshqa xarajatlarni o\'z ichiga olishi lozim. Agar bir necha mahsulot ishlab chiqariladigan yoki xizmat ko\'rsatiladigan bo\'lsa, ularning har bir turi bo\'yicha tannarx ko\'rsatiladi).';
  noteCell.style = { font: { size: 10 }, alignment: { wrapText: true } };
  sheet.getRow(1).height = 80;

  // Sarlavha
  sheet.mergeCells('A3:C3');
  const titleCell = sheet.getCell('A3');
  titleCell.value = 'Mahsulotlarning ishlab chiqarish tannarxi';
  titleCell.style = titleStyle;

  // Jadval sarlavhasi
  const headerRow = 5;
  const headers = ['№', 'Xarajatlar nomi', 'Summasi\n(ming so\'mda)'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.style = headerStyle;
  });
  sheet.getRow(headerRow).height = 35;

  // Ma'lumotlar
  const items = [
    { name: 'Ishlab chiqarish xodimlarining ish haqi', value: tannarx.ishHaqi },
    { name: 'Ijtimoiy soliq', value: tannarx.ijtimoiySoliq },
    { name: 'Xom ashyo va materiallarni sotib olish bilan bog\'liq xarajatlar', value: tannarx.xomashyo },
    { name: 'Asosiy vositalarning amortizatsiya xarajatlari', value: tannarx.amortizatsiya },
    { name: 'Boshqa ishlab chiqarish xarajatlari', value: tannarx.boshqaIshlab },
  ];

  let row = headerRow + 1;
  items.forEach((item, idx) => {
    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = item.name;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left' } };
    sheet.getCell(row, 3).value = Math.round(item.value / 1000);
    sheet.getCell(row, 3).style = cellStyle;
    row++;
  });

  // Jami tannarx
  sheet.mergeCells(`A${row}:B${row}`);
  sheet.getCell(row, 1).value = 'Jami tannarx';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 3).value = Math.round(tannarx.jamiTannarx / 1000);
  sheet.getCell(row, 3).style = { ...cellStyle, font: { bold: true } };
  row += 2;

  // Mahsulotlar
  tannarx.products.forEach((product, idx) => {
    sheet.getCell(row, 1).value = '';
    sheet.getCell(row, 2).value = `${product.name}*`;
    sheet.getCell(row, 2).style = { alignment: { horizontal: 'left' } };
    sheet.getCell(row, 3).value = Math.round(product.totalCost / 1000);
    row++;

    sheet.getCell(row, 1).value = `${idx + 1}-mahsulot`;
    sheet.getCell(row, 1).style = { font: { bold: true } };
    sheet.getCell(row, 2).value = 'Mahsulot soni';
    sheet.getCell(row, 3).value = product.quantity;
    row++;

    sheet.getCell(row, 2).value = 'Mahsulot narxi';
    sheet.getCell(row, 2).style = { font: { bold: true } };
    sheet.getCell(row, 3).value = Math.round(product.unitCost / 1000);
    sheet.getCell(row, 3).style = { font: { bold: true } };
    row++;
  });

  row++;
  sheet.getCell(row, 2).value = '* har bir mahsulot alohida ko\'rsatiladi';
  sheet.getCell(row, 2).style = { font: { italic: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 55;
  sheet.getColumn(3).width = 18;
}

// Davr xarajatlari varag'i
function createDavrXarajatlariSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Davr xarajatlari');
  const davrXarajatlari = calculateDavrXarajatlari(data.davrXarajatlari);

  // Sarlavha
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = 'DAVR XARAJATLARI';
  sheet.getCell('A1').style = titleStyle;

  sheet.mergeCells('A2:C2');
  sheet.getCell('A2').value = '(ming so\'mda)';
  sheet.getCell('A2').style = { alignment: { horizontal: 'center' } };

  // Jadval sarlavhasi
  const headerRow = 4;
  const headers = ['№', 'Xarajatlar nomi', 'Summasi'];
  headers.forEach((header, idx) => {
    const cell = sheet.getCell(headerRow, idx + 1);
    cell.value = header;
    cell.style = headerStyle;
  });

  // Ma'lumotlar
  let row = headerRow + 1;
  davrXarajatlari.expenses.forEach((expense, idx) => {
    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = expense.name;
    sheet.getCell(row, 2).style = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle' } };
    sheet.getCell(row, 3).value = Math.round(expense.amount);
    sheet.getCell(row, 3).style = cellStyle;
    row++;
  });

  // Jami
  sheet.mergeCells(`A${row}:B${row}`);
  sheet.getCell(row, 1).value = 'JAMI DAVR XARAJATLARI';
  sheet.getCell(row, 1).style = { ...subtotalStyle, font: { bold: true } };
  sheet.getCell(row, 3).value = Math.round(davrXarajatlari.total);
  sheet.getCell(row, 3).style = { ...cellStyle, font: { bold: true } };

  // Ustun kengliklari
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 18;
}

// Sotish rejasi varag'i
function createSotishRejasiSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Sotish rejasi');
  const sotishRejasi = calculateSotishRejasiByYear(data.sotishRejasi);
  const projectYears = data.projectInfo.projectDurationYears || 2;

  // Sarlavha
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'SOTISH REJASI';
  sheet.getCell('A1').style = titleStyle;

  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = '(ming so\'mda)';
  sheet.getCell('A2').style = { alignment: { horizontal: 'center' } };

  let currentRow = 4;

  // Har bir yil uchun
  for (let yearNum = 1; yearNum <= projectYears; yearNum++) {
    const yearData = sotishRejasi.find(y => y.year === yearNum);
    
    // Yil sarlavhasi
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(currentRow, 1).value = `${yearNum}-YIL`;
    sheet.getCell(currentRow, 1).style = { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } },
    };
    currentRow++;

    // Jadval sarlavhasi
    const headers = ['№', 'Mahsulotlar nomi', 'O\'lch. birligi', 'Miqdori', 'Narxi', 'Summasi'];
    headers.forEach((header, idx) => {
      const cell = sheet.getCell(currentRow, idx + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    currentRow++;

    // Mahsulotlar
    if (yearData && yearData.products.length > 0) {
      yearData.products.forEach((product, idx) => {
        sheet.getCell(currentRow, 1).value = idx + 1;
        sheet.getCell(currentRow, 1).style = cellStyle;
        sheet.getCell(currentRow, 2).value = product.name;
        sheet.getCell(currentRow, 2).style = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle' } };
        sheet.getCell(currentRow, 3).value = product.unit;
        sheet.getCell(currentRow, 3).style = cellStyle;
        sheet.getCell(currentRow, 4).value = product.quantity;
        sheet.getCell(currentRow, 4).style = cellStyle;
        sheet.getCell(currentRow, 5).value = Math.round(product.price);
        sheet.getCell(currentRow, 5).style = cellStyle;
        sheet.getCell(currentRow, 6).value = Math.round(product.quantity * product.price);
        sheet.getCell(currentRow, 6).style = cellStyle;
        currentRow++;
      });

      // Yil jami
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      sheet.getCell(currentRow, 1).value = `JAMI ${yearNum}-YIL`;
      sheet.getCell(currentRow, 1).style = { ...subtotalStyle, font: { bold: true } };
      sheet.getCell(currentRow, 6).value = Math.round(yearData.totalRevenue);
      sheet.getCell(currentRow, 6).style = { ...cellStyle, font: { bold: true } };
    } else {
      sheet.mergeCells(`A${currentRow}:F${currentRow}`);
      sheet.getCell(currentRow, 1).value = 'Ma\'lumot kiritilmagan';
      sheet.getCell(currentRow, 1).style = { ...cellStyle, font: { italic: true } };
    }
    currentRow += 2;
  }

  // Umumiy jami
  const grandTotal = sotishRejasi.reduce((sum, y) => sum + y.totalRevenue, 0);
  sheet.mergeCells(`A${currentRow}:E${currentRow}`);
  sheet.getCell(currentRow, 1).value = 'UMUMIY JAMI';
  sheet.getCell(currentRow, 1).style = { 
    ...subtotalStyle, 
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } },
  };
  sheet.getCell(currentRow, 6).value = Math.round(grandTotal);
  sheet.getCell(currentRow, 6).style = { 
    ...cellStyle, 
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A86E8' } },
  };

  // Ustun kengliklari
  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 35;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 15;
  sheet.getColumn(6).width = 18;
}

// Moliyaviy xisobot varag'i
function createMoliyaviyXisobotSheet(workbook: ExcelJS.Workbook, data: FormData) {
  const sheet = workbook.addWorksheet('Moliyaviy xisobot');
  const moliyaviyXisobot = calculateMoliyaviyXisobot(data);
  const projectYears = data.projectInfo.projectDurationYears || 2;

  // Sarlavha
  const lastCol = projectYears + 2;
  sheet.mergeCells(1, 1, 1, lastCol);
  sheet.getCell('A1').value = 'MOLIYAVIY XISOBOT (FOYDA-ZARAR)';
  sheet.getCell('A1').style = titleStyle;

  sheet.mergeCells(2, 1, 2, lastCol);
  sheet.getCell('A2').value = '(ming so\'mda)';
  sheet.getCell('A2').style = { alignment: { horizontal: 'center' } };

  // Jadval sarlavhasi
  const headerRow = 4;
  sheet.getCell(headerRow, 1).value = '№';
  sheet.getCell(headerRow, 1).style = headerStyle;
  sheet.getCell(headerRow, 2).value = 'Ko\'rsatkichlar';
  sheet.getCell(headerRow, 2).style = headerStyle;
  
  for (let i = 1; i <= projectYears; i++) {
    sheet.getCell(headerRow, i + 2).value = `${i}-yil`;
    sheet.getCell(headerRow, i + 2).style = headerStyle;
  }

  // Ko'rsatkichlar
  const indicators = [
    { name: 'Sotishdan tushum', key: 'sotishDaromadi' },
    { name: 'Sotilgan mahsulot tannarxi', key: 'tannarx' },
    { name: 'Yalpi daromad (foyda)', key: 'yalpiDaromad', isBold: true },
    { name: 'Davr xarajatlari', key: 'davrXarajatlari' },
    { name: 'Asosiy faoliyat foydasi', key: 'asosiyFaoliyatFoydasi', isBold: true },
    { name: 'Foyda solig\'i (12%)', key: 'foydaSoligi' },
    { name: 'SOF FOYDA', key: 'sofFoyda', isBold: true, isHighlight: true },
  ];

  let row = headerRow + 1;
  indicators.forEach((indicator, idx) => {
    sheet.getCell(row, 1).value = idx + 1;
    sheet.getCell(row, 1).style = cellStyle;
    sheet.getCell(row, 2).value = indicator.name;
    sheet.getCell(row, 2).style = { 
      ...cellStyle, 
      alignment: { horizontal: 'left', vertical: 'middle' },
      font: indicator.isBold ? { bold: true } : {},
    };

    for (let yearNum = 1; yearNum <= projectYears; yearNum++) {
      const yearData = moliyaviyXisobot.find(y => y.year === yearNum);
      const value = yearData ? (yearData as never)[indicator.key] : 0;
      const cell = sheet.getCell(row, yearNum + 2);
      cell.value = Math.round(value as number / 1000);
      
      if (indicator.isHighlight) {
        cell.style = {
          ...cellStyle,
          font: { bold: true, size: 11 },
          fill: { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: (value as number) >= 0 ? 'FF90EE90' : 'FFFF9999' }
          },
        };
      } else if (indicator.isBold) {
        cell.style = { ...cellStyle, font: { bold: true } };
      } else {
        cell.style = cellStyle;
      }
    }
    row++;
  });

  // Jami ustun
  row += 1;
  sheet.getCell(row, 2).value = 'Umumiy sof foyda (barcha yillar)';
  sheet.getCell(row, 2).style = { font: { bold: true, size: 12 } };
  const totalProfit = moliyaviyXisobot.reduce((sum, y) => sum + y.sofFoyda, 0);
  sheet.mergeCells(row, 3, row, lastCol);
  sheet.getCell(row, 3).value = Math.round(totalProfit / 1000);
  sheet.getCell(row, 3).style = {
    font: { bold: true, size: 12 },
    alignment: { horizontal: 'center' },
    fill: { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: totalProfit >= 0 ? 'FF90EE90' : 'FFFF9999' }
    },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // Ustun kengliklari
  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 35;
  for (let i = 1; i <= projectYears; i++) {
    sheet.getColumn(i + 2).width = 15;
  }
}

