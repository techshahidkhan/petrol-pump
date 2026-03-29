export interface Employee {
  id: string;
  name: string;
  phone: string;
  username: string;
  password: string;
  role: "admin" | "employee";
  active: boolean;
  createdAt: string;
}

export interface FuelType {
  id: string;
  name: string;
  nameHi: string;
  currentPrice: number;
  unit: string;
}

export interface Pump {
  id: string;
  pumpNumber: number;
  locationLabel: string;
  status: "active" | "inactive";
}

export interface Nozzle {
  id: string;
  pumpId: string;
  nozzleNumber: number;
  fuelTypeId: string;
  status: "active" | "inactive";
  initialReading: number;        // seed reading when nozzle first set up
}

export interface Shift {
  id: string;
  employeeId: string;
  nozzleId: string;
  openingReading: number;
  closingReading: number | null;
  totalLiters: number | null;     // total dispensed (including testing)
  testingQuantity: number;        // liters used for testing (not sold)
  fuelRate: number;               // rate per liter at time of shift
  totalAmount: number | null;     // auto: (totalLiters - testingQuantity) * fuelRate
  openingPhotoUrl: string | null;
  closingPhotoUrl: string | null;
  status: "active" | "completed";
  remarks: string;                // employee notes
  startedAt: string;
  endedAt: string | null;
}

export interface Payment {
  id: string;
  shiftId: string;
  cash: number;
  upi: number;
  card: number;
  credit: number;
  totalCollected: number;
}

export interface Tank {
  id: string;
  fuelTypeId: string;
  capacityLiters: number;
  currentLevel: number;
}

export interface TankReading {
  id: string;
  tankId: string;
  date: string;
  openingStock: number;
  closingStock: number;
  refillQuantity: number;
  dispensed: number;
  variance: number;
}

export interface CreditEntry {
  id: string;
  shiftId: string;
  customerName: string;
  vehicleNumber: string;
  amount: number;
  settled: boolean;
  settledAt: string | null;
}

export interface PriceChange {
  id: string;
  fuelTypeId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

export interface Expense {
  id: string;
  date: string;                  // YYYY-MM-DD
  category: "salary" | "maintenance" | "electricity" | "other";
  description: string;
  amount: number;
  createdBy: string;             // employee id
  createdAt: string;
}

// Daily cash & bank tracking
export interface DailyCollection {
  id: string;
  date: string;
  totalSalesAmount: number;
  totalCash: number;
  totalUpi: number;
  totalCard: number;
  totalCredit: number;
  totalCollected: number;
  shortage: number;
  totalTestingLiters: number;     // total testing quantity for the day
  totalExpenses: number;          // sum of day's expenses
  bankDeposit: number;            // manually entered
  previousCashBalance: number;    // carried forward
  cashInHand: number;             // auto: previousCashBalance + totalCash - bankDeposit - totalExpenses
  remarks: string;
  updatedAt: string;
}
