// Project Info
export interface ProjectInfo {
  projectName: string;
  organizationName: string;
  projectDescription: string;
  projectDurationYears: number; // Loyiha muddati yillarda
}

// Salary Types
export interface Employee {
  id: string;
  position: string;
  count: number;
  monthlySalary: number;
  durationMonths: number;
  financingSource: 'vazirlik' | 'tashkilot';
}

export interface SalaryData {
  managementStaff: Employee[];
  productionStaff: Employee[];
}

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  link: string;
  unit: string;
  quantity: number;
  price: number;
  financingSource: 'vazirlik' | 'tashkilot';
}

// Other Expenses Types
export interface OtherExpense {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  financingSource: 'vazirlik' | 'tashkilot';
}

export interface OtherExpensesData {
  managementExpenses: OtherExpense[];
  productionExpenses: OtherExpense[];
}

// Products Types
export interface Product {
  id: string;
  name: string;
  quantity: number;
}

// Raw Materials
export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  financingSource: 'vazirlik' | 'tashkilot';
}

// Davr xarajatlari (Period Expenses)
export interface DavrXarajat {
  id: string;
  name: string;
  amount: number; // Summasi (ming so'mda)
}

export interface DavrXarajatlari {
  expenses: DavrXarajat[];
}

// Sotish rejasi (Sales Plan)
export interface SotishMahsulot {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number; // Narxi (ming so'mda)
}

export interface SotishRejasiYil {
  year: number;
  products: SotishMahsulot[];
}

export interface SotishRejasi {
  years: SotishRejasiYil[];
}

// Full Form Data
export interface FormData {
  projectInfo: ProjectInfo;
  salary: SalaryData;
  inventory: InventoryItem[];
  rawMaterials: RawMaterial[];
  otherExpenses: OtherExpensesData;
  products: Product[];
  davrXarajatlari: DavrXarajatlari;
  sotishRejasi: SotishRejasi;
}

