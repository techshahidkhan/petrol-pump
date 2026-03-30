/**
 * Supabase Sync Layer
 *
 * Strategy: "Supabase as source of truth, localStorage as fast cache"
 * - On app init: load all data from Supabase → populate localStorage
 * - On every write: update localStorage AND fire async Supabase write
 * - All reads come from localStorage (synchronous, fast)
 */

import { supabase } from "./client";
import type { StoreData } from "../store/data";
import type {
  Employee, FuelType, Pump, Nozzle, Shift, Payment, Tank,
  TankReading, CreditEntry, DailyCollection, PriceChange, Expense,
} from "../store/types";

// ===== LOAD FROM SUPABASE → LOCALSTORAGE =====

export async function loadFromSupabase(): Promise<StoreData | null> {
  try {
    const [
      { data: employees },
      { data: fuelTypes },
      { data: pumps },
      { data: nozzles },
      { data: shifts },
      { data: payments },
      { data: tanks },
      { data: tankReadings },
      { data: creditEntries },
      { data: dailyCollections },
      { data: priceChanges },
      { data: expenses },
    ] = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("fuel_types").select("*"),
      supabase.from("pumps").select("*"),
      supabase.from("nozzles").select("*"),
      supabase.from("shifts").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("tanks").select("*"),
      supabase.from("tank_readings").select("*"),
      supabase.from("credit_entries").select("*"),
      supabase.from("daily_collections").select("*"),
      supabase.from("price_changes").select("*"),
      supabase.from("expenses").select("*"),
    ]);

    if (!employees || !fuelTypes || !pumps || !nozzles) {
      console.error("Failed to load core tables from Supabase");
      return null;
    }

    return {
      initialized: true,
      employees: (employees || []).map(mapEmployee),
      fuelTypes: (fuelTypes || []).map(mapFuelType),
      pumps: (pumps || []).map(mapPump),
      nozzles: (nozzles || []).map(mapNozzle),
      shifts: (shifts || []).map(mapShift),
      payments: (payments || []).map(mapPayment),
      tanks: (tanks || []).map(mapTank),
      tankReadings: (tankReadings || []).map(mapTankReading),
      creditEntries: (creditEntries || []).map(mapCreditEntry),
      dailyCollections: (dailyCollections || []).map(mapDailyCollection),
      priceChanges: (priceChanges || []).map(mapPriceChange),
      expenses: (expenses || []).map(mapExpense),
    };
  } catch (err) {
    console.error("Supabase load error:", err);
    return null;
  }
}

// ===== WRITE-THROUGH TO SUPABASE (fire-and-forget) =====

export function syncShiftToSupabase(shift: Shift) {
  supabase.from("shifts").upsert({
    id: shift.id,
    employee_id: shift.employeeId,
    nozzle_id: shift.nozzleId,
    opening_reading: shift.openingReading,
    closing_reading: shift.closingReading,
    total_liters: shift.totalLiters,
    testing_quantity: shift.testingQuantity,
    fuel_rate: shift.fuelRate,
    total_amount: shift.totalAmount,
    opening_photo_url: shift.openingPhotoUrl,
    closing_photo_url: shift.closingPhotoUrl,
    status: shift.status,
    remarks: shift.remarks,
    started_at: shift.startedAt,
    ended_at: shift.endedAt,
  }).then(({ error }) => { if (error) console.error("Sync shift error:", error); });
}

export function syncPaymentToSupabase(payment: Payment) {
  supabase.from("payments").upsert({
    id: payment.id,
    shift_id: payment.shiftId,
    cash: payment.cash,
    upi: payment.upi,
    card: payment.card,
    credit: payment.credit,
    // total_collected is generated column — don't send it
  }).then(({ error }) => { if (error) console.error("Sync payment error:", error); });
}

export function syncCreditEntryToSupabase(entry: CreditEntry) {
  supabase.from("credit_entries").upsert({
    id: entry.id,
    shift_id: entry.shiftId,
    customer_name: entry.customerName,
    vehicle_number: entry.vehicleNumber,
    amount: entry.amount,
    settled: entry.settled,
    settled_at: entry.settledAt,
  }).then(({ error }) => { if (error) console.error("Sync credit entry error:", error); });
}

export function syncEmployeeToSupabase(emp: Employee) {
  supabase.from("employees").upsert({
    id: emp.id,
    name: emp.name,
    phone: emp.phone,
    username: emp.username,
    password: emp.password,
    role: emp.role,
    status: emp.active ? "active" : "inactive",
    created_at: emp.createdAt,
  }).then(({ error }) => { if (error) console.error("Sync employee error:", error); });
}

export function syncFuelTypeToSupabase(ft: FuelType) {
  supabase.from("fuel_types").upsert({
    id: ft.id,
    name: ft.name,
    name_hi: ft.nameHi,
    current_price: ft.currentPrice,
    unit: ft.unit,
    updated_at: new Date().toISOString(),
  }).then(({ error }) => { if (error) console.error("Sync fuel type error:", error); });
}

export function syncPriceChangeToSupabase(pc: PriceChange) {
  supabase.from("price_changes").upsert({
    id: pc.id,
    fuel_type_id: pc.fuelTypeId,
    old_price: pc.oldPrice,
    new_price: pc.newPrice,
    changed_by: pc.changedBy || null,
    changed_at: pc.changedAt,
  }).then(({ error }) => { if (error) console.error("Sync price change error:", error); });
}

export function syncTankToSupabase(tank: Tank) {
  supabase.from("tanks").upsert({
    id: tank.id,
    fuel_type_id: tank.fuelTypeId,
    capacity_liters: tank.capacityLiters,
    current_level: tank.currentLevel,
  }).then(({ error }) => { if (error) console.error("Sync tank error:", error); });
}

export function syncTankReadingToSupabase(tr: TankReading) {
  supabase.from("tank_readings").upsert({
    id: tr.id,
    tank_id: tr.tankId,
    date: tr.date,
    opening_stock: tr.openingStock,
    closing_stock: tr.closingStock,
    refill_quantity: tr.refillQuantity,
    dispensed: tr.dispensed,
    // variance is generated column
  }).then(({ error }) => { if (error) console.error("Sync tank reading error:", error); });
}

export function syncExpenseToSupabase(expense: Expense) {
  supabase.from("expenses").upsert({
    id: expense.id,
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    created_by: expense.createdBy || null,
    created_at: expense.createdAt,
  }).then(({ error }) => { if (error) console.error("Sync expense error:", error); });
}

export function deleteExpenseFromSupabase(id: string) {
  supabase.from("expenses").delete().eq("id", id)
    .then(({ error }) => { if (error) console.error("Delete expense error:", error); });
}

export function syncDailyCollectionToSupabase(dc: DailyCollection) {
  supabase.from("daily_collections").upsert({
    id: dc.id,
    date: dc.date,
    total_sales_amount: dc.totalSalesAmount,
    total_cash: dc.totalCash,
    total_upi: dc.totalUpi,
    total_card: dc.totalCard,
    total_credit: dc.totalCredit,
    total_collected: dc.totalCollected,
    shortage: dc.shortage,
    total_testing_liters: dc.totalTestingLiters,
    total_expenses: dc.totalExpenses,
    bank_deposit: dc.bankDeposit,
    previous_cash_balance: dc.previousCashBalance,
    cash_in_hand: dc.cashInHand,
    remarks: dc.remarks,
    updated_at: dc.updatedAt,
  }).then(({ error }) => { if (error) console.error("Sync daily collection error:", error); });
}

// ===== MAPPERS: Supabase snake_case → App camelCase =====

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || "",
    username: row.username,
    password: row.password,
    role: row.role,
    active: row.status !== "inactive",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapFuelType(row: any): FuelType {
  return {
    id: row.id,
    name: row.name,
    nameHi: row.name_hi,
    currentPrice: Number(row.current_price),
    unit: row.unit || "litre",
  };
}

function mapPump(row: any): Pump {
  return {
    id: row.id,
    pumpNumber: row.pump_number,
    locationLabel: row.location_label || "",
    status: row.status || "active",
  };
}

function mapNozzle(row: any): Nozzle {
  return {
    id: row.id,
    pumpId: row.pump_id,
    nozzleNumber: row.nozzle_number,
    fuelTypeId: row.fuel_type_id,
    status: row.status || "active",
    initialReading: Number(row.initial_reading) || 0,
  };
}

function mapShift(row: any): Shift {
  return {
    id: row.id,
    employeeId: row.employee_id,
    nozzleId: row.nozzle_id,
    openingReading: Number(row.opening_reading),
    closingReading: row.closing_reading !== null ? Number(row.closing_reading) : null,
    totalLiters: row.total_liters !== null ? Number(row.total_liters) : null,
    testingQuantity: Number(row.testing_quantity) || 0,
    fuelRate: Number(row.fuel_rate),
    totalAmount: row.total_amount !== null ? Number(row.total_amount) : null,
    openingPhotoUrl: row.opening_photo_url,
    closingPhotoUrl: row.closing_photo_url,
    status: row.status,
    remarks: row.remarks || "",
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

function mapPayment(row: any): Payment {
  return {
    id: row.id,
    shiftId: row.shift_id,
    cash: Number(row.cash),
    upi: Number(row.upi),
    card: Number(row.card),
    credit: Number(row.credit),
    totalCollected: Number(row.total_collected),
  };
}

function mapTank(row: any): Tank {
  return {
    id: row.id,
    fuelTypeId: row.fuel_type_id,
    capacityLiters: Number(row.capacity_liters),
    currentLevel: Number(row.current_level),
  };
}

function mapTankReading(row: any): TankReading {
  return {
    id: row.id,
    tankId: row.tank_id,
    date: row.date,
    openingStock: Number(row.opening_stock),
    closingStock: Number(row.closing_stock),
    refillQuantity: Number(row.refill_quantity),
    dispensed: Number(row.dispensed),
    variance: Number(row.variance),
  };
}

function mapCreditEntry(row: any): CreditEntry {
  return {
    id: row.id,
    shiftId: row.shift_id,
    customerName: row.customer_name,
    vehicleNumber: row.vehicle_number || "",
    amount: Number(row.amount),
    settled: row.settled,
    settledAt: row.settled_at,
  };
}

function mapDailyCollection(row: any): DailyCollection {
  return {
    id: row.id,
    date: row.date,
    totalSalesAmount: Number(row.total_sales_amount),
    totalCash: Number(row.total_cash),
    totalUpi: Number(row.total_upi),
    totalCard: Number(row.total_card),
    totalCredit: Number(row.total_credit),
    totalCollected: Number(row.total_collected),
    shortage: Number(row.shortage),
    totalTestingLiters: Number(row.total_testing_liters),
    totalExpenses: Number(row.total_expenses),
    bankDeposit: Number(row.bank_deposit),
    previousCashBalance: Number(row.previous_cash_balance),
    cashInHand: Number(row.cash_in_hand),
    remarks: row.remarks || "",
    updatedAt: row.updated_at,
  };
}

function mapPriceChange(row: any): PriceChange {
  return {
    id: row.id,
    fuelTypeId: row.fuel_type_id,
    oldPrice: Number(row.old_price),
    newPrice: Number(row.new_price),
    changedBy: row.changed_by || "",
    changedAt: row.changed_at,
  };
}

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    description: row.description,
    amount: Number(row.amount),
    createdBy: row.created_by || "",
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
