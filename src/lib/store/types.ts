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
}

export interface Shift {
  id: string;
  employeeId: string;
  nozzleId: string;
  openingReading: number;
  closingReading: number | null;
  totalLiters: number | null;
  fuelRate: number;           // rate per liter at time of shift
  totalAmount: number | null; // auto: totalLiters * fuelRate
  openingPhotoUrl: string | null;
  closingPhotoUrl: string | null;
  status: "active" | "completed";
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
  changedBy: string;           // employee id (admin)
  changedAt: string;           // ISO timestamp
}

// Daily cash & bank tracking
export interface DailyCollection {
  id: string;
  date: string;               // YYYY-MM-DD
  totalSalesAmount: number;    // auto: sum of all completed shifts' totalAmount
  totalCash: number;           // auto: sum of all shift payments cash
  totalUpi: number;            // auto: sum of all shift payments upi
  totalCard: number;           // auto: sum of all shift payments card
  totalCredit: number;         // auto: sum of all shift payments credit
  totalCollected: number;      // auto: cash + upi + card + credit
  shortage: number;            // auto: totalSalesAmount - totalCollected
  bankDeposit: number;         // manually entered
  previousCashBalance: number; // carried forward
  cashInHand: number;          // auto: previousCashBalance + totalCash - bankDeposit
  remarks: string;
  updatedAt: string;
}
