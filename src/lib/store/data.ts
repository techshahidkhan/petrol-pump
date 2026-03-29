import { generateId } from "../utils";
import type {
  Employee, FuelType, Pump, Nozzle, Shift, Payment, Tank, TankReading, CreditEntry,
  DailyCollection, PriceChange
} from "./types";

const STORAGE_KEY = "petrol_pump_data";

export interface StoreData {
  employees: Employee[];
  fuelTypes: FuelType[];
  pumps: Pump[];
  nozzles: Nozzle[];
  shifts: Shift[];
  payments: Payment[];
  tanks: Tank[];
  tankReadings: TankReading[];
  creditEntries: CreditEntry[];
  dailyCollections: DailyCollection[];
  priceChanges: PriceChange[];
  initialized: boolean;
}

function getDefaultData(): StoreData {
  const petrolId = generateId();
  const dieselId = generateId();
  const pump1Id = generateId();
  const pump2Id = generateId();
  const pump3Id = generateId();
  const pump4Id = generateId();
  const adminId = generateId();
  const emp1Id = generateId();
  const emp2Id = generateId();
  const emp3Id = generateId();

  return {
    initialized: true,
    employees: [
      { id: adminId, name: "Rajesh Kumar", phone: "9876543210", username: "admin", password: "admin123", role: "admin", active: true, createdAt: new Date().toISOString() },
      { id: emp1Id, name: "Suresh Yadav", phone: "9876543211", username: "suresh", password: "1234", role: "employee", active: true, createdAt: new Date().toISOString() },
      { id: emp2Id, name: "Amit Sharma", phone: "9876543212", username: "amit", password: "1234", role: "employee", active: true, createdAt: new Date().toISOString() },
      { id: emp3Id, name: "Priya Singh", phone: "9876543213", username: "priya", password: "1234", role: "employee", active: true, createdAt: new Date().toISOString() },
    ],
    fuelTypes: [
      { id: petrolId, name: "Petrol", nameHi: "पेट्रोल", currentPrice: 106.31, unit: "litre" },
      { id: dieselId, name: "Diesel", nameHi: "डीज़ल", currentPrice: 92.27, unit: "litre" },
    ],
    pumps: [
      { id: pump1Id, pumpNumber: 1, locationLabel: "Front Left", status: "active" },
      { id: pump2Id, pumpNumber: 2, locationLabel: "Front Right", status: "active" },
      { id: pump3Id, pumpNumber: 3, locationLabel: "Back Left", status: "active" },
      { id: pump4Id, pumpNumber: 4, locationLabel: "Back Right", status: "active" },
    ],
    nozzles: [
      { id: generateId(), pumpId: pump1Id, nozzleNumber: 1, fuelTypeId: petrolId, status: "active" },
      { id: generateId(), pumpId: pump1Id, nozzleNumber: 2, fuelTypeId: dieselId, status: "active" },
      { id: generateId(), pumpId: pump2Id, nozzleNumber: 1, fuelTypeId: petrolId, status: "active" },
      { id: generateId(), pumpId: pump2Id, nozzleNumber: 2, fuelTypeId: dieselId, status: "active" },
      { id: generateId(), pumpId: pump3Id, nozzleNumber: 1, fuelTypeId: petrolId, status: "active" },
      { id: generateId(), pumpId: pump3Id, nozzleNumber: 2, fuelTypeId: dieselId, status: "active" },
      { id: generateId(), pumpId: pump4Id, nozzleNumber: 1, fuelTypeId: petrolId, status: "active" },
      { id: generateId(), pumpId: pump4Id, nozzleNumber: 2, fuelTypeId: dieselId, status: "active" },
    ],
    shifts: [],
    payments: [],
    tanks: [
      { id: generateId(), fuelTypeId: petrolId, capacityLiters: 10000, currentLevel: 7500 },
      { id: generateId(), fuelTypeId: dieselId, capacityLiters: 10000, currentLevel: 8200 },
    ],
    tankReadings: [],
    creditEntries: [],
    dailyCollections: [],
    priceChanges: [],
  };
}

export function getStore(): StoreData {
  if (typeof window === "undefined") return getDefaultData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = getDefaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  const parsed = JSON.parse(raw);
  // Migrate older stored data
  if (!parsed.dailyCollections) parsed.dailyCollections = [];
  if (!parsed.priceChanges) parsed.priceChanges = [];
  // Add fuelRate/totalAmount to old shifts that don't have them
  if (parsed.shifts) {
    for (const s of parsed.shifts) {
      if (s.fuelRate === undefined) s.fuelRate = 0;
      if (s.totalAmount === undefined) s.totalAmount = null;
    }
  }
  return parsed;
}

export function saveStore(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetStore(): StoreData {
  const data = getDefaultData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

// Auth
export function login(username: string, password: string): Employee | null {
  const store = getStore();
  return store.employees.find(
    (e) => e.username === username && e.password === password && e.active
  ) || null;
}

export function getCurrentUser(): Employee | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("current_user");
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(emp: Employee | null): void {
  if (emp) {
    localStorage.setItem("current_user", JSON.stringify(emp));
  } else {
    localStorage.removeItem("current_user");
  }
}

// Shifts
export function startShift(employeeId: string, nozzleId: string, openingReading: number, photoUrl: string | null): Shift {
  const store = getStore();
  const existing = store.shifts.find(s => s.nozzleId === nozzleId && s.status === "active");
  if (existing) throw new Error("Nozzle already has an active shift");

  // Get current fuel rate for this nozzle
  const nozzle = store.nozzles.find(n => n.id === nozzleId);
  const fuel = nozzle ? store.fuelTypes.find(f => f.id === nozzle.fuelTypeId) : null;
  const fuelRate = fuel?.currentPrice || 0;

  const shift: Shift = {
    id: generateId(),
    employeeId,
    nozzleId,
    openingReading,
    closingReading: null,
    totalLiters: null,
    fuelRate,
    totalAmount: null,
    openingPhotoUrl: photoUrl,
    closingPhotoUrl: null,
    status: "active",
    startedAt: new Date().toISOString(),
    endedAt: null,
  };
  store.shifts.push(shift);
  saveStore(store);
  return shift;
}

export function endShift(
  shiftId: string,
  closingReading: number,
  closingPhotoUrl: string | null,
  payment: { cash: number; upi: number; card: number; credit: number },
  creditEntries?: { customerName: string; vehicleNumber: string; amount: number }[]
): { shift: Shift; payment: Payment } {
  const store = getStore();
  const idx = store.shifts.findIndex(s => s.id === shiftId);
  if (idx === -1) throw new Error("Shift not found");

  const shift = store.shifts[idx];
  shift.closingReading = closingReading;
  shift.totalLiters = closingReading - shift.openingReading;
  shift.totalAmount = shift.totalLiters * shift.fuelRate;
  shift.closingPhotoUrl = closingPhotoUrl;
  shift.status = "completed";
  shift.endedAt = new Date().toISOString();
  store.shifts[idx] = shift;

  const paymentRecord: Payment = {
    id: generateId(),
    shiftId,
    cash: payment.cash,
    upi: payment.upi,
    card: payment.card,
    credit: payment.credit,
    totalCollected: payment.cash + payment.upi + payment.card + payment.credit,
  };
  store.payments.push(paymentRecord);

  if (creditEntries) {
    for (const ce of creditEntries) {
      store.creditEntries.push({
        id: generateId(),
        shiftId,
        customerName: ce.customerName,
        vehicleNumber: ce.vehicleNumber,
        amount: ce.amount,
        settled: false,
        settledAt: null,
      });
    }
  }

  saveStore(store);
  return { shift, payment: paymentRecord };
}

export function getActiveShiftForEmployee(employeeId: string): Shift | null {
  const store = getStore();
  return store.shifts.find(s => s.employeeId === employeeId && s.status === "active") || null;
}

export function getActiveShiftForNozzle(nozzleId: string): Shift | null {
  const store = getStore();
  return store.shifts.find(s => s.nozzleId === nozzleId && s.status === "active") || null;
}

// Tank operations
export function addTankReading(tankId: string, date: string, openingStock: number, closingStock: number, refillQuantity: number, dispensed: number): TankReading {
  const store = getStore();
  const reading: TankReading = {
    id: generateId(),
    tankId,
    date,
    openingStock,
    closingStock,
    refillQuantity,
    dispensed,
    variance: openingStock + refillQuantity - closingStock - dispensed,
  };
  store.tankReadings.push(reading);
  const tankIdx = store.tanks.findIndex(t => t.id === tankId);
  if (tankIdx !== -1) {
    store.tanks[tankIdx].currentLevel = closingStock;
  }
  saveStore(store);
  return reading;
}

export function addRefill(tankId: string, quantity: number): void {
  const store = getStore();
  const idx = store.tanks.findIndex(t => t.id === tankId);
  if (idx !== -1) {
    store.tanks[idx].currentLevel += quantity;
    saveStore(store);
  }
}

// Employee CRUD
export function addEmployee(emp: Omit<Employee, "id" | "createdAt" | "active">): Employee {
  const store = getStore();
  const newEmp: Employee = { ...emp, id: generateId(), active: true, createdAt: new Date().toISOString() };
  store.employees.push(newEmp);
  saveStore(store);
  return newEmp;
}

export function updateEmployee(id: string, updates: Partial<Employee>): void {
  const store = getStore();
  const idx = store.employees.findIndex(e => e.id === id);
  if (idx !== -1) {
    store.employees[idx] = { ...store.employees[idx], ...updates };
    saveStore(store);
  }
}

// Credit operations
export function settleCreditEntry(id: string): void {
  const store = getStore();
  const idx = store.creditEntries.findIndex(c => c.id === id);
  if (idx !== -1) {
    store.creditEntries[idx].settled = true;
    store.creditEntries[idx].settledAt = new Date().toISOString();
    saveStore(store);
  }
}

// Fuel type operations
export function updateFuelPrice(id: string, price: number): void {
  const store = getStore();
  const idx = store.fuelTypes.findIndex(f => f.id === id);
  if (idx !== -1) {
    const oldPrice = store.fuelTypes[idx].currentPrice;
    if (oldPrice !== price) {
      const user = getCurrentUser();
      store.priceChanges.push({
        id: generateId(),
        fuelTypeId: id,
        oldPrice,
        newPrice: price,
        changedBy: user?.id || "",
        changedAt: new Date().toISOString(),
      });
    }
    store.fuelTypes[idx].currentPrice = price;
    saveStore(store);
  }
}

export function getPriceHistory(fuelTypeId?: string): PriceChange[] {
  const store = getStore();
  const changes = fuelTypeId
    ? store.priceChanges.filter(p => p.fuelTypeId === fuelTypeId)
    : store.priceChanges;
  return changes.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

// ===== DAILY COLLECTION (Bank Deposit & Cash Tracking) =====

export function getDailyCollection(date: string): DailyCollection | null {
  const store = getStore();
  return store.dailyCollections.find(d => d.date === date) || null;
}

export function getPreviousDailyCollection(date: string): DailyCollection | null {
  const store = getStore();
  const sorted = store.dailyCollections
    .filter(d => d.date < date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0] || null;
}

export function recalcDailyCollection(date: string): DailyCollection {
  const store = getStore();
  const dayShifts = store.shifts.filter(s => s.startedAt.startsWith(date) && s.status === "completed");

  let totalSalesAmount = 0;
  let totalCash = 0, totalUpi = 0, totalCard = 0, totalCredit = 0;

  for (const shift of dayShifts) {
    totalSalesAmount += shift.totalAmount || 0;
    const payment = store.payments.find(p => p.shiftId === shift.id);
    if (payment) {
      totalCash += payment.cash;
      totalUpi += payment.upi;
      totalCard += payment.card;
      totalCredit += payment.credit;
    }
  }

  const totalCollected = totalCash + totalUpi + totalCard + totalCredit;
  const existing = store.dailyCollections.find(d => d.date === date);
  const prev = getPreviousDailyCollection(date);
  const previousCashBalance = prev?.cashInHand || 0;
  const bankDeposit = existing?.bankDeposit || 0;
  const remarks = existing?.remarks || "";

  return {
    id: existing?.id || generateId(),
    date,
    totalSalesAmount,
    totalCash,
    totalUpi,
    totalCard,
    totalCredit,
    totalCollected,
    shortage: totalSalesAmount - totalCollected,
    bankDeposit,
    previousCashBalance,
    cashInHand: previousCashBalance + totalCash - bankDeposit,
    remarks,
    updatedAt: new Date().toISOString(),
  };
}

export function saveDailyCollection(date: string, bankDeposit: number, remarks: string): DailyCollection {
  const store = getStore();
  const collection = recalcDailyCollection(date);
  collection.bankDeposit = bankDeposit;
  collection.cashInHand = collection.previousCashBalance + collection.totalCash - bankDeposit;
  collection.remarks = remarks;
  collection.updatedAt = new Date().toISOString();

  const idx = store.dailyCollections.findIndex(d => d.date === date);
  if (idx !== -1) {
    store.dailyCollections[idx] = collection;
  } else {
    store.dailyCollections.push(collection);
  }
  saveStore(store);
  return collection;
}

// Get last closing reading for a nozzle (for auto-fill on next shift start)
export function getLastClosingReading(nozzleId: string): number | null {
  const store = getStore();
  const completed = store.shifts
    .filter(s => s.nozzleId === nozzleId && s.status === "completed" && s.closingReading !== null)
    .sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime());
  return completed.length > 0 ? completed[0].closingReading : null;
}

// Helpers
export function getNozzlesForPump(pumpId: string): Nozzle[] {
  return getStore().nozzles.filter(n => n.pumpId === pumpId);
}

export function getFuelTypeById(id: string): FuelType | undefined {
  return getStore().fuelTypes.find(f => f.id === id);
}

export function getPumpById(id: string): Pump | undefined {
  return getStore().pumps.find(p => p.id === id);
}

export function getNozzleById(id: string): Nozzle | undefined {
  return getStore().nozzles.find(n => n.id === id);
}

export function getEmployeeById(id: string): Employee | undefined {
  return getStore().employees.find(e => e.id === id);
}

export function getPaymentForShift(shiftId: string): Payment | undefined {
  return getStore().payments.find(p => p.shiftId === shiftId);
}

export function getTodayShifts(): Shift[] {
  const today = new Date().toISOString().split("T")[0];
  return getStore().shifts.filter(s => s.startedAt.startsWith(today));
}

export function getTodaySummary() {
  const store = getStore();
  const today = new Date().toISOString().split("T")[0];
  const todayShifts = store.shifts.filter(s => s.startedAt.startsWith(today));
  const completedShifts = todayShifts.filter(s => s.status === "completed");

  let totalLiters = 0;
  let totalAmount = 0;
  let totalCollected = 0;

  for (const shift of completedShifts) {
    const liters = shift.totalLiters || 0;
    totalLiters += liters;
    totalAmount += shift.totalAmount || (liters * shift.fuelRate);
    const payment = store.payments.find(p => p.shiftId === shift.id);
    if (payment) totalCollected += payment.totalCollected;
  }

  // Get daily collection for bank/cash info
  const dc = store.dailyCollections.find(d => d.date === today);

  return {
    totalLiters,
    totalAmount,
    totalCollected,
    shortage: totalAmount - totalCollected,
    activeShifts: todayShifts.filter(s => s.status === "active").length,
    bankDeposit: dc?.bankDeposit || 0,
    cashInHand: dc?.cashInHand || 0,
    previousCashBalance: dc?.previousCashBalance || 0,
  };
}

export function getAlerts() {
  const store = getStore();
  const today = new Date().toISOString().split("T")[0];
  const alerts: { id: string; type: string; severity: "red" | "yellow" | "green"; message: string; messageHi: string }[] = [];
  const todayShifts = store.shifts.filter(s => s.startedAt.startsWith(today) && s.status === "completed");

  for (const shift of todayShifts) {
    if (shift.closingReading !== null && shift.closingReading < shift.openingReading) {
      const emp = store.employees.find(e => e.id === shift.employeeId);
      alerts.push({
        id: shift.id, type: "reading_error", severity: "red",
        message: `Reading error: ${emp?.name || "Unknown"} - closing < opening`,
        messageHi: `रीडिंग त्रुटि: ${emp?.name || "अज्ञात"} - क्लोज़िंग < ओपनिंग`,
      });
    }
    const payment = store.payments.find(p => p.shiftId === shift.id);
    if (payment) {
      const expected = shift.totalAmount || 0;
      const diff = expected - payment.totalCollected;
      if (diff > 100) {
        const emp = store.employees.find(e => e.id === shift.employeeId);
        alerts.push({
          id: shift.id, type: "cash_shortage", severity: diff > 500 ? "red" : "yellow",
          message: `Cash shortage ₹${diff.toFixed(0)} by ${emp?.name || "Unknown"}`,
          messageHi: `नकद कमी ₹${diff.toFixed(0)} - ${emp?.name || "अज्ञात"}`,
        });
      }
    }
  }

  const todayReadings = store.tankReadings.filter(r => r.date === today);
  for (const reading of todayReadings) {
    if (Math.abs(reading.variance) > 50) {
      const tank = store.tanks.find(t => t.id === reading.tankId);
      const fuel = tank ? store.fuelTypes.find(f => f.id === tank.fuelTypeId) : null;
      alerts.push({
        id: reading.id, type: "stock_discrepancy",
        severity: Math.abs(reading.variance) > 100 ? "red" : "yellow",
        message: `Tank ${fuel?.name || "?"} variance: ${reading.variance.toFixed(1)}L`,
        messageHi: `टैंक ${fuel?.nameHi || "?"} अंतर: ${reading.variance.toFixed(1)}L`,
      });
    }
  }

  return alerts;
}
