import type { FormData, SalaryData, OtherExpensesData, DavrXarajatlari, SotishRejasi } from '../types';

// Ijtimoiy soliq foizi (12%)
export const SOCIAL_TAX_RATE = 0.12;

// Foyda solig'i foizi (12%)
export const PROFIT_TAX_RATE = 0.12;

// Ish haqi hisoblash
export function calculateSalaryTotals(salary: SalaryData) {
  const managementTotal = salary.managementStaff.reduce((sum, emp) => {
    return sum + (emp.monthlySalary * emp.count * emp.durationMonths);
  }, 0);

  const productionTotal = salary.productionStaff.reduce((sum, emp) => {
    return sum + (emp.monthlySalary * emp.count * emp.durationMonths);
  }, 0);

  const managementVazirlik = salary.managementStaff
    .filter(e => e.financingSource === 'vazirlik')
    .reduce((sum, emp) => sum + (emp.monthlySalary * emp.count * emp.durationMonths), 0);

  const managementTashkilot = salary.managementStaff
    .filter(e => e.financingSource === 'tashkilot')
    .reduce((sum, emp) => sum + (emp.monthlySalary * emp.count * emp.durationMonths), 0);

  const productionVazirlik = salary.productionStaff
    .filter(e => e.financingSource === 'vazirlik')
    .reduce((sum, emp) => sum + (emp.monthlySalary * emp.count * emp.durationMonths), 0);

  const productionTashkilot = salary.productionStaff
    .filter(e => e.financingSource === 'tashkilot')
    .reduce((sum, emp) => sum + (emp.monthlySalary * emp.count * emp.durationMonths), 0);

  const totalSalary = managementTotal + productionTotal;
  const totalSocialTax = totalSalary * SOCIAL_TAX_RATE;

  return {
    managementTotal,
    managementSocialTax: managementTotal * SOCIAL_TAX_RATE,
    managementVazirlik,
    managementTashkilot,
    productionTotal,
    productionSocialTax: productionTotal * SOCIAL_TAX_RATE,
    productionVazirlik,
    productionTashkilot,
    totalSalary,
    totalSocialTax,
    grandTotal: totalSalary + totalSocialTax,
  };
}

// Inventar hisoblash
export function calculateInventoryTotals(inventory: FormData['inventory']) {
  const total = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const vazirlik = inventory
    .filter(i => i.financingSource === 'vazirlik')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const tashkilot = inventory
    .filter(i => i.financingSource === 'tashkilot')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return { total, vazirlik, tashkilot };
}

// Xom ashyo hisoblash
export function calculateRawMaterialsTotals(rawMaterials: FormData['rawMaterials']) {
  const total = rawMaterials.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const vazirlik = rawMaterials
    .filter(i => i.financingSource === 'vazirlik')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const tashkilot = rawMaterials
    .filter(i => i.financingSource === 'tashkilot')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return { total, vazirlik, tashkilot };
}

// Boshqa xarajatlar hisoblash
export function calculateOtherExpensesTotals(expenses: OtherExpensesData) {
  const managementTotal = expenses.managementExpenses.reduce((sum, exp) => {
    return sum + (exp.price * exp.quantity);
  }, 0);

  const productionTotal = expenses.productionExpenses.reduce((sum, exp) => {
    return sum + (exp.price * exp.quantity);
  }, 0);

  const managementVazirlik = expenses.managementExpenses
    .filter(e => e.financingSource === 'vazirlik')
    .reduce((sum, exp) => sum + (exp.price * exp.quantity), 0);

  const managementTashkilot = expenses.managementExpenses
    .filter(e => e.financingSource === 'tashkilot')
    .reduce((sum, exp) => sum + (exp.price * exp.quantity), 0);

  const productionVazirlik = expenses.productionExpenses
    .filter(e => e.financingSource === 'vazirlik')
    .reduce((sum, exp) => sum + (exp.price * exp.quantity), 0);

  const productionTashkilot = expenses.productionExpenses
    .filter(e => e.financingSource === 'tashkilot')
    .reduce((sum, exp) => sum + (exp.price * exp.quantity), 0);

  return {
    managementTotal,
    productionTotal,
    total: managementTotal + productionTotal,
    managementVazirlik,
    managementTashkilot,
    productionVazirlik,
    productionTashkilot,
    vazirlik: managementVazirlik + productionVazirlik,
    tashkilot: managementTashkilot + productionTashkilot,
  };
}

// Davr xarajatlari hisoblash
export function calculateDavrXarajatlari(davrXarajatlari: DavrXarajatlari) {
  const total = davrXarajatlari.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  return { total, expenses: davrXarajatlari.expenses };
}

// Sotish rejasi hisoblash (yillik)
export function calculateSotishRejasiByYear(sotishRejasi: SotishRejasi) {
  return sotishRejasi.years.map((yearData) => {
    const totalQuantity = yearData.products.reduce((sum, p) => sum + p.quantity, 0);
    const totalRevenue = yearData.products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    return {
      year: yearData.year,
      products: yearData.products,
      totalQuantity,
      totalRevenue,
    };
  });
}

// Jami xarajatlar hisoblash
export function calculateGrandTotals(data: FormData) {
  const salary = calculateSalaryTotals(data.salary);
  const inventory = calculateInventoryTotals(data.inventory);
  const rawMaterials = calculateRawMaterialsTotals(data.rawMaterials);
  const otherExpenses = calculateOtherExpensesTotals(data.otherExpenses);

  const ishHaqiFondi = salary.totalSalary;
  const ijtimoiySoliq = salary.totalSocialTax;
  const xomashyo = rawMaterials.total;
  const inventarTotal = inventory.total;
  const boshqaXarajatlar = otherExpenses.total;

  const grandTotal = ishHaqiFondi + ijtimoiySoliq + xomashyo + inventarTotal + boshqaXarajatlar;

  return {
    ishHaqiFondi,
    ijtimoiySoliq,
    xomashyo,
    inventar: inventarTotal,
    boshqaXarajatlar,
    grandTotal,
    vazirlik: {
      ishHaqiFondi: salary.managementVazirlik + salary.productionVazirlik,
      ijtimoiySoliq: (salary.managementVazirlik + salary.productionVazirlik) * SOCIAL_TAX_RATE,
      xomashyo: rawMaterials.vazirlik,
      inventar: inventory.vazirlik,
      boshqaXarajatlar: otherExpenses.vazirlik,
    },
    tashkilot: {
      ishHaqiFondi: salary.managementTashkilot + salary.productionTashkilot,
      ijtimoiySoliq: (salary.managementTashkilot + salary.productionTashkilot) * SOCIAL_TAX_RATE,
      xomashyo: rawMaterials.tashkilot,
      inventar: inventory.tashkilot,
      boshqaXarajatlar: otherExpenses.tashkilot,
    },
  };
}

// Tannarx hisoblash
export function calculateTannarx(data: FormData) {
  const salary = calculateSalaryTotals(data.salary);
  const rawMaterials = calculateRawMaterialsTotals(data.rawMaterials);
  const otherExpenses = calculateOtherExpensesTotals(data.otherExpenses);
  const inventory = calculateInventoryTotals(data.inventory);

  const ishHaqi = salary.productionTotal;
  const ijtimoiySoliq = salary.productionSocialTax;
  const xomashyo = rawMaterials.total;
  const amortizatsiya = inventory.total * 0.2; // 20% amortizatsiya
  const boshqaIshlab = otherExpenses.productionTotal;

  const jamiTannarx = ishHaqi + ijtimoiySoliq + xomashyo + amortizatsiya + boshqaIshlab;

  // Mahsulot tannarxini hisoblash
  const totalProducts = data.products.reduce((sum, p) => sum + p.quantity, 0);
  
  return {
    ishHaqi,
    ijtimoiySoliq,
    xomashyo,
    amortizatsiya,
    boshqaIshlab,
    jamiTannarx,
    products: data.products.map(p => ({
      ...p,
      unitCost: totalProducts > 0 ? (jamiTannarx * (p.quantity / totalProducts)) / p.quantity : 0,
      totalCost: totalProducts > 0 ? jamiTannarx * (p.quantity / totalProducts) : 0,
    })),
  };
}

// Moliyaviy xisobot - yillik foyda-zarar hisoblash
export interface MoliyaviyXisobotYil {
  year: number;
  // Daromadlar
  sotishDaromadi: number; // Sotishdan tushum
  tannarx: number; // Sotilgan mahsulot tannarxi
  yalpiDaromad: number; // Yalpi daromad (foyda) = sotish - tannarx
  
  // Davr xarajatlari
  davrXarajatlari: number;
  
  // Asosiy faoliyat
  asosiyFaoliyatFoydasi: number; // Yalpi daromad - davr xarajatlari
  
  // Soliqlar
  foydaSoligi: number; // 12%
  
  // Sof foyda
  sofFoyda: number;
}

export function calculateMoliyaviyXisobot(data: FormData): MoliyaviyXisobotYil[] {
  const tannarx = calculateTannarx(data);
  const davrXarajatlari = calculateDavrXarajatlari(data.davrXarajatlari);
  const sotishRejasi = calculateSotishRejasiByYear(data.sotishRejasi);
  
  // Yillik tannarx (loyiha muddatiga bo'linadi)
  const projectYears = data.projectInfo.projectDurationYears || 1;
  const yearlyTannarx = tannarx.jamiTannarx / projectYears;
  const yearlyDavrXarajatlari = davrXarajatlari.total / projectYears;

  return sotishRejasi.map((yearSales) => {
    const sotishDaromadi = yearSales.totalRevenue;
    const currentTannarx = yearlyTannarx;
    const yalpiDaromad = sotishDaromadi - currentTannarx;
    
    const currentDavrXarajatlari = yearlyDavrXarajatlari;
    const asosiyFaoliyatFoydasi = yalpiDaromad - currentDavrXarajatlari;
    
    // Foyda solig'i faqat foyda bo'lsa hisoblanadi
    const foydaSoligi = asosiyFaoliyatFoydasi > 0 ? asosiyFaoliyatFoydasi * PROFIT_TAX_RATE : 0;
    
    const sofFoyda = asosiyFaoliyatFoydasi - foydaSoligi;

    return {
      year: yearSales.year,
      sotishDaromadi,
      tannarx: currentTannarx,
      yalpiDaromad,
      davrXarajatlari: currentDavrXarajatlari,
      asosiyFaoliyatFoydasi,
      foydaSoligi,
      sofFoyda,
    };
  });
}

// Raqamni formatlash
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(num));
}

