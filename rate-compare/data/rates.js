/*
 * RATE DATA — replace the sample values below with real data.
 *
 * All rates are annual percentages (e.g. 4.85 means 4.85% p.a.).
 * Bank names and rates in this file are FICTIONAL placeholders.
 *
 * Schema
 * ------
 * banks[]        { id, name, color }
 * savings[]      { bankId, product, baseRate, bonusRate, bonusConditions,
 *                  minBalance, maxBalance (null = no cap on the rate),
 *                  rateAboveMax (rate paid on the part above maxBalance),
 *                  monthlyFee }
 * termDeposits[] { bankId, product, minDeposit, maxDeposit (null = none),
 *                  interestPaid ("maturity" | "monthly" | "annually"),
 *                  rates: { <term in months>: rate, ... } }
 *                  Leave a term out if the bank doesn't offer it.
 */
window.RATES_DATA = {
  lastUpdated: "2026-11-25",
  currency: "AUD",
  locale: "en-AU",

  banks: [
    { id: "harbour",  name: "Harbour Bank",         color: "#2563eb" },
    { id: "summit",   name: "Summit Mutual",        color: "#16a34a" },
    { id: "northern", name: "Northern Trust Co.",   color: "#9333ea" },
    { id: "coastal",  name: "Coastal Credit Union", color: "#0891b2" },
    { id: "ironbark", name: "Ironbark Savings",     color: "#b45309" },
    { id: "meridian", name: "Meridian Digital",     color: "#db2777" },
    { id: "pioneer",  name: "Pioneer Bank",         color: "#dc2626" },
    { id: "lakeside", name: "Lakeside Building Society", color: "#4d7c0f" }
  ],

  savings: [
    { bankId: "harbour",  product: "Bonus Saver",        baseRate: 0.50, bonusRate: 4.40, bonusConditions: "Deposit $1,000+/month and no withdrawals", minBalance: 0,    maxBalance: 250000, rateAboveMax: 0.50, monthlyFee: 0 },
    { bankId: "harbour",  product: "Everyday Saver",     baseRate: 2.10, bonusRate: 0,    bonusConditions: "",                                       minBalance: 0,    maxBalance: null,   rateAboveMax: null, monthlyFee: 0 },
    { bankId: "summit",   product: "Goal Saver",         baseRate: 1.25, bonusRate: 3.75, bonusConditions: "Balance grows by $200+ each month",       minBalance: 0,    maxBalance: 100000, rateAboveMax: 1.25, monthlyFee: 0 },
    { bankId: "northern", product: "Premium Savings",    baseRate: 4.15, bonusRate: 0,    bonusConditions: "",                                       minBalance: 5000, maxBalance: null,   rateAboveMax: null, monthlyFee: 0 },
    { bankId: "coastal",  product: "Member Saver",       baseRate: 0.85, bonusRate: 4.05, bonusConditions: "Linked everyday account + 5 card purchases/month", minBalance: 0, maxBalance: 50000, rateAboveMax: 0.85, monthlyFee: 0 },
    { bankId: "ironbark", product: "Online Saver",       baseRate: 4.60, bonusRate: 0,    bonusConditions: "Introductory rate for 4 months, then 3.10%", minBalance: 0, maxBalance: null,  rateAboveMax: null, monthlyFee: 0 },
    { bankId: "meridian", product: "Hi-Interest Pot",    baseRate: 0.10, bonusRate: 5.00, bonusConditions: "Salary of $2,000+/month into linked account", minBalance: 0, maxBalance: 75000, rateAboveMax: 0.10, monthlyFee: 0 },
    { bankId: "pioneer",  product: "Smart Saver",        baseRate: 1.50, bonusRate: 3.10, bonusConditions: "One deposit per month, no withdrawals",   minBalance: 0,    maxBalance: 500000, rateAboveMax: 1.50, monthlyFee: 0 },
    { bankId: "lakeside", product: "Reward Saver",       baseRate: 3.20, bonusRate: 1.30, bonusConditions: "No withdrawals in the calendar month",    minBalance: 1000, maxBalance: null,   rateAboveMax: null, monthlyFee: 0 },
    { bankId: "lakeside", product: "Cash Management",    baseRate: 3.55, bonusRate: 0,    bonusConditions: "",                                       minBalance: 20000, maxBalance: null,  rateAboveMax: null, monthlyFee: 5 }
  ],

  termDeposits: [
    { bankId: "harbour",  product: "Term Deposit",          minDeposit: 5000,  maxDeposit: 2000000, interestPaid: "maturity", rates: { 1: 3.60, 3: 4.30, 6: 4.45, 12: 4.40, 24: 4.10, 36: 4.00, 60: 4.00 } },
    { bankId: "summit",   product: "Fixed Term Saver",      minDeposit: 1000,  maxDeposit: null,    interestPaid: "maturity", rates: { 3: 4.40, 6: 4.60, 9: 4.55, 12: 4.50, 24: 4.20 } },
    { bankId: "northern", product: "Premium Term Deposit",  minDeposit: 10000, maxDeposit: 5000000, interestPaid: "annually", rates: { 1: 3.75, 3: 4.20, 6: 4.35, 12: 4.65, 24: 4.35, 36: 4.25, 60: 4.15 } },
    { bankId: "coastal",  product: "Member Term Deposit",   minDeposit: 2000,  maxDeposit: 1000000, interestPaid: "maturity", rates: { 3: 4.50, 6: 4.70, 12: 4.55, 24: 4.25, 36: 4.10 } },
    { bankId: "ironbark", product: "Term Investment",       minDeposit: 5000,  maxDeposit: null,    interestPaid: "monthly",  rates: { 1: 3.40, 3: 4.15, 6: 4.40, 9: 4.50, 12: 4.45, 24: 4.30, 36: 4.20, 60: 4.10 } },
    { bankId: "meridian", product: "Digital Term Deposit",  minDeposit: 500,   maxDeposit: 250000,  interestPaid: "maturity", rates: { 3: 4.65, 6: 4.80, 12: 4.70 } },
    { bankId: "pioneer",  product: "Term Deposit",          minDeposit: 5000,  maxDeposit: 2000000, interestPaid: "maturity", rates: { 1: 3.25, 3: 4.00, 6: 4.20, 12: 4.30, 24: 4.05, 36: 3.95, 60: 3.90 } },
    { bankId: "lakeside", product: "Fixed Investment",      minDeposit: 1000,  maxDeposit: null,    interestPaid: "annually", rates: { 6: 4.50, 12: 4.60, 24: 4.45, 36: 4.35, 60: 4.25 } }
  ]
};
