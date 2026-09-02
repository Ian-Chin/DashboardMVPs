// Static reference entities: the "master data" a real deployment would sync from
// the POS / back-office. Everything transactional is derived in demoData.js.

export const company = {
  id: 'co_beanco',
  name: 'Bean & Co.',
  legalName: 'Bean & Co. Hospitality Sdn Bhd',
  registrationNo: '202201009884 (1456221-M)',
  currency: 'RM',
  locale: 'en-MY',
  timezone: 'Asia/Kuala_Lumpur',
  taxLabel: 'SST',
  taxRate: 6,
  taxInclusivePricing: true,
  serviceChargeRate: 0,
  fiscalYearStart: '01-01',
  businessHours: { open: '08:00', close: '22:00' },
  posProvider: 'StoreHub (demo connector)',
  posLastSync: '4 minutes ago',
}

export const outlets = [
  {
    id: 'out_klcc',
    code: 'KLCC',
    name: 'Bean & Co. KLCC',
    shortName: 'KLCC',
    address: 'Lot 2.14, Suria KLCC, 50088 Kuala Lumpur',
    city: 'Kuala Lumpur',
    openedAt: '2022-03-14',
    seats: 68,
    manager: 'Nurul Aisyah',
    targetFoodCostPct: 32,
    targetLaborCostPct: 20,
    targetGrossMarginPct: 66,
    rentMonthly: 10500,
    utilitiesMonthly: 2400,
    marketingMonthly: 1100,
    otherOpexMonthly: 950,
    ordersBaseline: 106,
    avgTicketBias: 1.12,
    deliveryShare: 0.24,
    hours: { open: '09:00', close: '22:00' },
  },
  {
    id: 'out_subang',
    code: 'SUB',
    name: 'Bean & Co. Subang',
    shortName: 'Subang',
    address: 'G-12, SS15 Courtyard, 47500 Subang Jaya',
    city: 'Subang Jaya',
    openedAt: '2022-11-02',
    seats: 54,
    manager: 'Daniel Wong',
    targetFoodCostPct: 32,
    targetLaborCostPct: 20,
    targetGrossMarginPct: 66,
    rentMonthly: 7000,
    utilitiesMonthly: 1800,
    marketingMonthly: 750,
    otherOpexMonthly: 700,
    ordersBaseline: 87,
    avgTicketBias: 1.0,
    deliveryShare: 0.28,
    hours: { open: '08:00', close: '23:00' },
  },
  {
    id: 'out_pj',
    code: 'PJ',
    name: 'Bean & Co. PJ',
    shortName: 'PJ',
    address: '17 Jalan SS2/64, 47300 Petaling Jaya',
    city: 'Petaling Jaya',
    openedAt: '2023-06-20',
    seats: 46,
    manager: 'Sharmila Devi',
    targetFoodCostPct: 32,
    targetLaborCostPct: 20,
    targetGrossMarginPct: 66,
    rentMonthly: 5400,
    utilitiesMonthly: 1550,
    marketingMonthly: 600,
    otherOpexMonthly: 620,
    ordersBaseline: 69,
    avgTicketBias: 0.94,
    deliveryShare: 0.31,
    hours: { open: '08:00', close: '22:00' },
  },
  {
    id: 'out_shahalam',
    code: 'SA',
    name: 'Bean & Co. Shah Alam',
    shortName: 'Shah Alam',
    address: 'B-01, Setia City Mall, 40170 Shah Alam',
    city: 'Shah Alam',
    openedAt: '2024-09-05',
    seats: 40,
    manager: 'Faiz Rahman',
    targetFoodCostPct: 33,
    targetLaborCostPct: 21,
    targetGrossMarginPct: 65,
    rentMonthly: 4800,
    utilitiesMonthly: 1400,
    marketingMonthly: 700,
    otherOpexMonthly: 550,
    ordersBaseline: 60,
    avgTicketBias: 0.9,
    deliveryShare: 0.26,
    hours: { open: '10:00', close: '22:00' },
  },
]

export const users = [
  { id: 'usr_ian', name: 'Ian Chin', email: 'ian@beanco.my', role: 'Owner', outletIds: 'all', lastActive: 'now', status: 'active' },
  { id: 'usr_mei', name: 'Mei Ling Tan', email: 'meiling@beanco.my', role: 'Admin', outletIds: 'all', lastActive: '2 hours ago', status: 'active' },
  { id: 'usr_nurul', name: 'Nurul Aisyah', email: 'nurul@beanco.my', role: 'Manager', outletIds: ['out_klcc'], lastActive: 'yesterday', status: 'active' },
  { id: 'usr_daniel', name: 'Daniel Wong', email: 'daniel@beanco.my', role: 'Manager', outletIds: ['out_subang'], lastActive: '3 hours ago', status: 'active' },
  { id: 'usr_sharmila', name: 'Sharmila Devi', email: 'sharmila@beanco.my', role: 'Manager', outletIds: ['out_pj'], lastActive: 'yesterday', status: 'active' },
  { id: 'usr_faiz', name: 'Faiz Rahman', email: 'faiz@beanco.my', role: 'Manager', outletIds: ['out_shahalam'], lastActive: '5 days ago', status: 'invited' },
  { id: 'usr_hafiz', name: 'Hafiz Idris', email: 'hafiz@beanco.my', role: 'Staff', outletIds: ['out_klcc'], lastActive: 'today', status: 'active' },
]

export const ROLE_PERMISSIONS = [
  { role: 'Owner', scope: 'All outlets', abilities: ['View financials', 'Edit settings', 'Manage users', 'Export reports'] },
  { role: 'Admin', scope: 'All outlets', abilities: ['View financials', 'Edit settings', 'Export reports'] },
  { role: 'Manager', scope: 'Assigned outlet', abilities: ['View outlet P&L', 'Manage inventory', 'Export reports'] },
  { role: 'Staff', scope: 'Assigned outlet', abilities: ['Record waste', 'Record stock counts'] },
]

export const suppliers = [
  { id: 'sup_segar', name: 'Segar Fresh Sdn Bhd', category: 'Produce', contact: 'Kamal', phone: '+60 12-334 8890', leadTimeDays: 1, rating: 4.4, terms: 'Net 14' },
  { id: 'sup_ayammas', name: 'Ayam Mas Poultry', category: 'Protein', contact: 'Lim Chee Keong', phone: '+60 13-772 1140', leadTimeDays: 2, rating: 4.1, terms: 'Net 30' },
  { id: 'sup_ocean', name: 'Ocean Harvest Seafood', category: 'Seafood', contact: 'Rajesh', phone: '+60 16-220 4477', leadTimeDays: 2, rating: 4.6, terms: 'Net 14' },
  { id: 'sup_kopikaw', name: 'Kopi Kaw Roasters', category: 'Beverage', contact: 'Alicia Yong', phone: '+60 11-2255 8080', leadTimeDays: 3, rating: 4.8, terms: 'Net 30' },
  { id: 'sup_dapur', name: 'Dapur Grocer Supplies', category: 'Dry goods', contact: 'Siti Zubaidah', phone: '+60 19-880 3311', leadTimeDays: 2, rating: 4.0, terms: 'Net 30' },
  { id: 'sup_dairy', name: 'Fresh Milk Co.', category: 'Dairy', contact: 'Jason Teoh', phone: '+60 12-908 5512', leadTimeDays: 1, rating: 4.5, terms: 'Net 7' },
  { id: 'sup_bakeri', name: 'Bakeri Utama', category: 'Bakery', contact: 'Hafizah', phone: '+60 17-664 9021', leadTimeDays: 1, rating: 4.2, terms: 'COD' },
]

/**
 * Ingredients.
 *  cost        — baseline unit cost at the start of the demo history
 *  drift       — annualised price trend, applied smoothly across the period
 *  varianceBias— structural yield loss/theft signal used to build actual usage
 *  minStock    — reorder point per outlet (days of stock are derived)
 */
export const ingredients = [
  { id: 'ing_chicken_breast', name: 'Chicken Breast', category: 'Protein', unit: 'kg', cost: 15.2, drift: 0.42, varianceBias: 0.075, minStock: 18, shelfLifeDays: 4, supplierId: 'sup_ayammas' },
  { id: 'ing_chicken_whole', name: 'Whole Chicken', category: 'Protein', unit: 'kg', cost: 11.5, drift: 0.3, varianceBias: 0.03, minStock: 25, shelfLifeDays: 4, supplierId: 'sup_ayammas' },
  { id: 'ing_beef_patty', name: 'Beef Patty 150g', category: 'Protein', unit: 'kg', cost: 28.0, drift: 0.18, varianceBias: 0.02, minStock: 10, shelfLifeDays: 7, supplierId: 'sup_ayammas' },
  { id: 'ing_prawn', name: 'Tiger Prawn', category: 'Seafood', unit: 'kg', cost: 38.0, drift: 0.22, varianceBias: 0.045, minStock: 6, shelfLifeDays: 3, supplierId: 'sup_ocean' },
  { id: 'ing_fish_fillet', name: 'Dory Fillet', category: 'Seafood', unit: 'kg', cost: 24.0, drift: 0.09, varianceBias: 0.028, minStock: 8, shelfLifeDays: 3, supplierId: 'sup_ocean' },
  { id: 'ing_anchovies', name: 'Anchovies (Ikan Bilis)', category: 'Dry goods', unit: 'kg', cost: 42.0, drift: 0.12, varianceBias: 0.01, minStock: 3, shelfLifeDays: 120, supplierId: 'sup_dapur' },
  { id: 'ing_egg', name: 'Eggs (Grade B)', category: 'Dairy', unit: 'tray', cost: 13.5, drift: 0.16, varianceBias: 0.035, minStock: 12, shelfLifeDays: 14, supplierId: 'sup_dairy' },
  { id: 'ing_milk', name: 'Fresh Milk', category: 'Dairy', unit: 'L', cost: 6.8, drift: 0.1, varianceBias: 0.05, minStock: 30, shelfLifeDays: 7, supplierId: 'sup_dairy' },
  { id: 'ing_cream', name: 'Whipping Cream', category: 'Dairy', unit: 'L', cost: 18.0, drift: 0.08, varianceBias: 0.03, minStock: 6, shelfLifeDays: 14, supplierId: 'sup_dairy' },
  { id: 'ing_butter', name: 'Butter (Unsalted)', category: 'Dairy', unit: 'kg', cost: 26.0, drift: 0.14, varianceBias: 0.02, minStock: 5, shelfLifeDays: 60, supplierId: 'sup_dairy' },
  { id: 'ing_cheese', name: 'Cheddar Slice', category: 'Dairy', unit: 'kg', cost: 32.0, drift: 0.11, varianceBias: 0.04, minStock: 4, shelfLifeDays: 45, supplierId: 'sup_dairy' },
  { id: 'ing_ice_cream', name: 'Vanilla Ice Cream', category: 'Dairy', unit: 'L', cost: 14.0, drift: 0.05, varianceBias: 0.06, minStock: 8, shelfLifeDays: 90, supplierId: 'sup_dairy' },
  { id: 'ing_coffee', name: 'Arabica Beans', category: 'Beverage', unit: 'kg', cost: 62.0, drift: 0.35, varianceBias: 0.055, minStock: 8, shelfLifeDays: 180, supplierId: 'sup_kopikaw' },
  { id: 'ing_matcha', name: 'Matcha Powder', category: 'Beverage', unit: 'kg', cost: 180.0, drift: 0.26, varianceBias: 0.02, minStock: 1.5, shelfLifeDays: 180, supplierId: 'sup_kopikaw' },
  { id: 'ing_tea', name: 'Black Tea Dust', category: 'Beverage', unit: 'kg', cost: 48.0, drift: 0.08, varianceBias: 0.015, minStock: 3, shelfLifeDays: 240, supplierId: 'sup_kopikaw' },
  { id: 'ing_condensed', name: 'Condensed Milk', category: 'Beverage', unit: 'tin', cost: 5.4, drift: 0.09, varianceBias: 0.02, minStock: 40, shelfLifeDays: 300, supplierId: 'sup_dapur' },
  { id: 'ing_milo', name: 'Malt Powder', category: 'Beverage', unit: 'kg', cost: 28.0, drift: 0.07, varianceBias: 0.02, minStock: 5, shelfLifeDays: 240, supplierId: 'sup_dapur' },
  { id: 'ing_syrup', name: 'Vanilla Syrup', category: 'Beverage', unit: 'L', cost: 24.0, drift: 0.04, varianceBias: 0.01, minStock: 4, shelfLifeDays: 300, supplierId: 'sup_kopikaw' },
  { id: 'ing_orange', name: 'Valencia Orange', category: 'Produce', unit: 'kg', cost: 7.4, drift: 0.19, varianceBias: 0.05, minStock: 15, shelfLifeDays: 10, supplierId: 'sup_segar' },
  { id: 'ing_rice', name: 'Jasmine Rice', category: 'Dry goods', unit: 'kg', cost: 4.2, drift: 0.15, varianceBias: 0.025, minStock: 60, shelfLifeDays: 365, supplierId: 'sup_dapur' },
  { id: 'ing_noodle', name: 'Yellow Noodle', category: 'Dry goods', unit: 'kg', cost: 5.2, drift: 0.06, varianceBias: 0.03, minStock: 20, shelfLifeDays: 5, supplierId: 'sup_dapur' },
  { id: 'ing_pasta', name: 'Dry Pasta', category: 'Dry goods', unit: 'kg', cost: 9.8, drift: 0.05, varianceBias: 0.015, minStock: 12, shelfLifeDays: 365, supplierId: 'sup_dapur' },
  { id: 'ing_flour', name: 'Wheat Flour', category: 'Dry goods', unit: 'kg', cost: 3.4, drift: 0.07, varianceBias: 0.01, minStock: 20, shelfLifeDays: 240, supplierId: 'sup_dapur' },
  { id: 'ing_sugar', name: 'Fine Sugar', category: 'Dry goods', unit: 'kg', cost: 3.1, drift: 0.03, varianceBias: 0.02, minStock: 25, shelfLifeDays: 365, supplierId: 'sup_dapur' },
  { id: 'ing_oil', name: 'Cooking Oil', category: 'Dry goods', unit: 'L', cost: 8.9, drift: 0.2, varianceBias: 0.04, minStock: 30, shelfLifeDays: 300, supplierId: 'sup_dapur' },
  { id: 'ing_coconut', name: 'Coconut Milk', category: 'Dry goods', unit: 'L', cost: 7.2, drift: 0.13, varianceBias: 0.03, minStock: 18, shelfLifeDays: 5, supplierId: 'sup_dapur' },
  { id: 'ing_soy', name: 'Light Soy Sauce', category: 'Dry goods', unit: 'L', cost: 9.5, drift: 0.04, varianceBias: 0.01, minStock: 10, shelfLifeDays: 365, supplierId: 'sup_dapur' },
  { id: 'ing_oyster', name: 'Oyster Sauce', category: 'Dry goods', unit: 'kg', cost: 12.5, drift: 0.05, varianceBias: 0.01, minStock: 8, shelfLifeDays: 365, supplierId: 'sup_dapur' },
  { id: 'ing_chocolate', name: 'Dark Chocolate', category: 'Dry goods', unit: 'kg', cost: 45.0, drift: 0.44, varianceBias: 0.02, minStock: 4, shelfLifeDays: 240, supplierId: 'sup_dapur' },
  { id: 'ing_peanut', name: 'Roasted Peanut', category: 'Dry goods', unit: 'kg', cost: 16.0, drift: 0.1, varianceBias: 0.02, minStock: 6, shelfLifeDays: 150, supplierId: 'sup_dapur' },
  { id: 'ing_lettuce', name: 'Romaine Lettuce', category: 'Produce', unit: 'kg', cost: 8.5, drift: 0.24, varianceBias: 0.11, minStock: 8, shelfLifeDays: 4, supplierId: 'sup_segar' },
  { id: 'ing_tomato', name: 'Tomato', category: 'Produce', unit: 'kg', cost: 6.2, drift: 0.28, varianceBias: 0.085, minStock: 10, shelfLifeDays: 6, supplierId: 'sup_segar' },
  { id: 'ing_onion', name: 'Big Onion', category: 'Produce', unit: 'kg', cost: 4.8, drift: 0.16, varianceBias: 0.04, minStock: 20, shelfLifeDays: 21, supplierId: 'sup_segar' },
  { id: 'ing_garlic', name: 'Garlic', category: 'Produce', unit: 'kg', cost: 12.0, drift: 0.21, varianceBias: 0.03, minStock: 8, shelfLifeDays: 30, supplierId: 'sup_segar' },
  { id: 'ing_chili', name: 'Red Chili', category: 'Produce', unit: 'kg', cost: 14.0, drift: 0.31, varianceBias: 0.07, minStock: 6, shelfLifeDays: 7, supplierId: 'sup_segar' },
  { id: 'ing_cucumber', name: 'Cucumber', category: 'Produce', unit: 'kg', cost: 4.5, drift: 0.12, varianceBias: 0.06, minStock: 8, shelfLifeDays: 7, supplierId: 'sup_segar' },
  { id: 'ing_potato', name: 'Potato', category: 'Produce', unit: 'kg', cost: 5.6, drift: 0.14, varianceBias: 0.05, minStock: 25, shelfLifeDays: 30, supplierId: 'sup_segar' },
  { id: 'ing_mushroom', name: 'Button Mushroom', category: 'Produce', unit: 'kg', cost: 18.0, drift: 0.17, varianceBias: 0.065, minStock: 5, shelfLifeDays: 5, supplierId: 'sup_segar' },
  { id: 'ing_ginger', name: 'Ginger', category: 'Produce', unit: 'kg', cost: 9.0, drift: 0.18, varianceBias: 0.03, minStock: 5, shelfLifeDays: 21, supplierId: 'sup_segar' },
  { id: 'ing_spring_onion', name: 'Spring Onion', category: 'Produce', unit: 'kg', cost: 11.0, drift: 0.2, varianceBias: 0.09, minStock: 4, shelfLifeDays: 5, supplierId: 'sup_segar' },
  { id: 'ing_pandan', name: 'Pandan Leaf', category: 'Produce', unit: 'bundle', cost: 2.0, drift: 0.05, varianceBias: 0.05, minStock: 10, shelfLifeDays: 7, supplierId: 'sup_segar' },
  { id: 'ing_bun', name: 'Brioche Bun', category: 'Bakery', unit: 'pc', cost: 1.2, drift: 0.09, varianceBias: 0.03, minStock: 120, shelfLifeDays: 3, supplierId: 'sup_bakeri' },
  { id: 'ing_bread', name: 'Sandwich Loaf', category: 'Bakery', unit: 'loaf', cost: 4.6, drift: 0.08, varianceBias: 0.04, minStock: 20, shelfLifeDays: 4, supplierId: 'sup_bakeri' },
  { id: 'ing_kaya', name: 'Pandan Kaya', category: 'Bakery', unit: 'kg', cost: 15.0, drift: 0.06, varianceBias: 0.02, minStock: 4, shelfLifeDays: 30, supplierId: 'sup_bakeri' },
  { id: 'ing_packaging', name: 'Takeaway Packaging', category: 'Packaging', unit: 'set', cost: 0.85, drift: 0.11, varianceBias: 0.02, minStock: 400, shelfLifeDays: 999, supplierId: 'sup_dapur' },
]

/** Competing quotes for the same ingredient. Drives Purchasing → Potential Savings. */
export const supplierQuotes = [
  { ingredientId: 'ing_chicken_breast', supplierId: 'sup_segar', priceFactor: 0.915, note: 'Frozen, 5kg vacuum pack', minOrder: '20 kg' },
  { ingredientId: 'ing_chicken_whole', supplierId: 'sup_dapur', priceFactor: 0.97, note: 'Weekly contract price', minOrder: '30 kg' },
  { ingredientId: 'ing_coffee', supplierId: 'sup_dapur', priceFactor: 0.945, note: 'Same origin, 12kg sack', minOrder: '12 kg' },
  { ingredientId: 'ing_milk', supplierId: 'sup_dapur', priceFactor: 0.93, note: 'UHT alternative', minOrder: '48 L' },
  { ingredientId: 'ing_lettuce', supplierId: 'sup_dapur', priceFactor: 0.88, note: 'Cameron Highlands direct', minOrder: '10 kg' },
  { ingredientId: 'ing_beef_patty', supplierId: 'sup_ocean', priceFactor: 0.96, note: 'Halal certified, frozen', minOrder: '15 kg' },
  { ingredientId: 'ing_chocolate', supplierId: 'sup_bakeri', priceFactor: 0.9, note: '55% couverture', minOrder: '5 kg' },
  { ingredientId: 'ing_potato', supplierId: 'sup_dapur', priceFactor: 0.94, note: 'Grade A, 25kg bag', minOrder: '25 kg' },
  { ingredientId: 'ing_prawn', supplierId: 'sup_segar', priceFactor: 0.98, note: 'Smaller grade 31/40', minOrder: '5 kg' },
  { ingredientId: 'ing_bun', supplierId: 'sup_dapur', priceFactor: 0.87, note: 'Standard bun, not brioche', minOrder: '200 pc' },
]

export const MENU_CATEGORIES = ['Food', 'Drinks', 'Desserts', 'Other']

/**
 * Menu items with their recipes (bill of materials).
 * qty is expressed in the ingredient's own unit.
 * popularity is a relative sales weight inside the whole menu.
 */
export const menuItems = [
  {
    id: 'mi_nasi_lemak', name: 'Nasi Lemak Ayam Rendang', category: 'Food', station: 'Hot kitchen', price: 14.9, popularity: 9.0, priceChangedAt: '2025-11-04',
    recipe: [
      { ingredientId: 'ing_rice', qty: 0.16 }, { ingredientId: 'ing_coconut', qty: 0.08 }, { ingredientId: 'ing_chicken_whole', qty: 0.19 },
      { ingredientId: 'ing_anchovies', qty: 0.012 }, { ingredientId: 'ing_peanut', qty: 0.012 }, { ingredientId: 'ing_egg', qty: 0.035 },
      { ingredientId: 'ing_chili', qty: 0.02 }, { ingredientId: 'ing_cucumber', qty: 0.03 }, { ingredientId: 'ing_pandan', qty: 0.04 },
    ],
  },
  {
    id: 'mi_chicken_rice', name: 'Hainanese Chicken Rice', category: 'Food', station: 'Hot kitchen', price: 12.5, popularity: 10.5, priceChangedAt: '2025-08-12',
    recipe: [
      { ingredientId: 'ing_chicken_whole', qty: 0.22 }, { ingredientId: 'ing_rice', qty: 0.15 }, { ingredientId: 'ing_cucumber', qty: 0.03 },
      { ingredientId: 'ing_garlic', qty: 0.006 }, { ingredientId: 'ing_ginger', qty: 0.006 }, { ingredientId: 'ing_soy', qty: 0.012 },
      { ingredientId: 'ing_oil', qty: 0.012 },
    ],
  },
  {
    id: 'mi_ckt', name: 'Char Kuey Teow', category: 'Food', station: 'Wok', price: 13.9, popularity: 6.4, priceChangedAt: '2025-06-01',
    recipe: [
      { ingredientId: 'ing_noodle', qty: 0.2 }, { ingredientId: 'ing_prawn', qty: 0.045 }, { ingredientId: 'ing_egg', qty: 0.035 },
      { ingredientId: 'ing_soy', qty: 0.015 }, { ingredientId: 'ing_oil', qty: 0.02 }, { ingredientId: 'ing_spring_onion', qty: 0.015 },
      { ingredientId: 'ing_chili', qty: 0.012 },
    ],
  },
  {
    id: 'mi_mee_goreng', name: 'Mee Goreng Mamak', category: 'Food', station: 'Wok', price: 11.5, popularity: 5.2, priceChangedAt: '2025-06-01',
    recipe: [
      { ingredientId: 'ing_noodle', qty: 0.2 }, { ingredientId: 'ing_egg', qty: 0.035 }, { ingredientId: 'ing_potato', qty: 0.05 },
      { ingredientId: 'ing_tomato', qty: 0.04 }, { ingredientId: 'ing_chili', qty: 0.015 }, { ingredientId: 'ing_oil', qty: 0.02 },
    ],
  },
  {
    id: 'mi_burger', name: 'Beef Burger Deluxe', category: 'Food', station: 'Grill', price: 22.9, popularity: 6.8, priceChangedAt: '2024-12-15',
    recipe: [
      { ingredientId: 'ing_beef_patty', qty: 0.19 }, { ingredientId: 'ing_bun', qty: 1 }, { ingredientId: 'ing_cheese', qty: 0.055 },
      { ingredientId: 'ing_lettuce', qty: 0.025 }, { ingredientId: 'ing_tomato', qty: 0.035 }, { ingredientId: 'ing_onion', qty: 0.025 },
      { ingredientId: 'ing_potato', qty: 0.14 }, { ingredientId: 'ing_oil', qty: 0.03 }, { ingredientId: 'ing_butter', qty: 0.012 },
    ],
  },
  {
    id: 'mi_chicken_chop', name: 'Grilled Chicken Chop', category: 'Food', station: 'Grill', price: 24.9, popularity: 5.6, priceChangedAt: '2025-03-10',
    recipe: [
      { ingredientId: 'ing_chicken_breast', qty: 0.24 }, { ingredientId: 'ing_potato', qty: 0.16 }, { ingredientId: 'ing_mushroom', qty: 0.05 },
      { ingredientId: 'ing_butter', qty: 0.018 }, { ingredientId: 'ing_cream', qty: 0.03 }, { ingredientId: 'ing_lettuce', qty: 0.02 },
    ],
  },
  {
    id: 'mi_aglio', name: 'Aglio Olio Prawn', category: 'Food', station: 'Hot kitchen', price: 23.9, popularity: 3.9, priceChangedAt: '2025-03-10',
    recipe: [
      { ingredientId: 'ing_pasta', qty: 0.12 }, { ingredientId: 'ing_prawn', qty: 0.09 }, { ingredientId: 'ing_garlic', qty: 0.015 },
      { ingredientId: 'ing_chili', qty: 0.008 }, { ingredientId: 'ing_oil', qty: 0.035 }, { ingredientId: 'ing_spring_onion', qty: 0.01 },
    ],
  },
  {
    id: 'mi_carbonara', name: 'Carbonara Pasta', category: 'Food', station: 'Hot kitchen', price: 21.9, popularity: 2.6, priceChangedAt: '2024-10-01',
    recipe: [
      { ingredientId: 'ing_pasta', qty: 0.12 }, { ingredientId: 'ing_cream', qty: 0.11 }, { ingredientId: 'ing_cheese', qty: 0.05 },
      { ingredientId: 'ing_egg', qty: 0.035 }, { ingredientId: 'ing_mushroom', qty: 0.05 }, { ingredientId: 'ing_butter', qty: 0.02 },
    ],
  },
  {
    id: 'mi_nasi_goreng', name: 'Nasi Goreng Kampung', category: 'Food', station: 'Wok', price: 12.9, popularity: 5.8, priceChangedAt: '2025-06-01',
    recipe: [
      { ingredientId: 'ing_rice', qty: 0.18 }, { ingredientId: 'ing_anchovies', qty: 0.02 }, { ingredientId: 'ing_egg', qty: 0.035 },
      { ingredientId: 'ing_chili', qty: 0.015 }, { ingredientId: 'ing_spring_onion', qty: 0.012 }, { ingredientId: 'ing_oil', qty: 0.02 },
    ],
  },
  {
    id: 'mi_fish_chips', name: 'Fish & Chips', category: 'Food', station: 'Fryer', price: 26.9, popularity: 3.1, priceChangedAt: '2025-03-10',
    recipe: [
      { ingredientId: 'ing_fish_fillet', qty: 0.22 }, { ingredientId: 'ing_potato', qty: 0.22 }, { ingredientId: 'ing_flour', qty: 0.05 },
      { ingredientId: 'ing_oil', qty: 0.06 }, { ingredientId: 'ing_lettuce', qty: 0.02 },
    ],
  },
  {
    id: 'mi_roti_telur', name: 'Roti Telur Set', category: 'Food', station: 'Hot kitchen', price: 8.9, popularity: 4.4, priceChangedAt: '2025-06-01',
    recipe: [
      { ingredientId: 'ing_flour', qty: 0.09 }, { ingredientId: 'ing_egg', qty: 0.035 }, { ingredientId: 'ing_butter', qty: 0.015 },
      { ingredientId: 'ing_onion', qty: 0.02 },
    ],
  },
  {
    id: 'mi_club_sandwich', name: 'Club Sandwich', category: 'Food', station: 'Cold kitchen', price: 18.5, popularity: 2.9, priceChangedAt: '2024-12-15',
    recipe: [
      { ingredientId: 'ing_bread', qty: 0.22 }, { ingredientId: 'ing_chicken_breast', qty: 0.11 }, { ingredientId: 'ing_egg', qty: 0.035 },
      { ingredientId: 'ing_cheese', qty: 0.035 }, { ingredientId: 'ing_lettuce', qty: 0.03 }, { ingredientId: 'ing_tomato', qty: 0.03 },
      { ingredientId: 'ing_potato', qty: 0.1 },
    ],
  },
  {
    id: 'mi_caesar', name: 'Caesar Salad', category: 'Food', station: 'Cold kitchen', price: 16.9, popularity: 1.8, priceChangedAt: '2024-08-01',
    recipe: [
      { ingredientId: 'ing_lettuce', qty: 0.16 }, { ingredientId: 'ing_cheese', qty: 0.03 }, { ingredientId: 'ing_egg', qty: 0.035 },
      { ingredientId: 'ing_bread', qty: 0.05 }, { ingredientId: 'ing_oil', qty: 0.02 },
    ],
  },
  {
    id: 'mi_mushroom_soup', name: 'Mushroom Soup & Bun', category: 'Food', station: 'Hot kitchen', price: 12.9, popularity: 2.4, priceChangedAt: '2024-08-01',
    recipe: [
      { ingredientId: 'ing_mushroom', qty: 0.1 }, { ingredientId: 'ing_cream', qty: 0.08 }, { ingredientId: 'ing_butter', qty: 0.015 },
      { ingredientId: 'ing_bun', qty: 1 }, { ingredientId: 'ing_onion', qty: 0.02 },
    ],
  },
  {
    id: 'mi_kopi_o', name: 'Kopi O', category: 'Drinks', station: 'Bar', price: 3.5, popularity: 8.2, priceChangedAt: '2025-06-01',
    recipe: [{ ingredientId: 'ing_coffee', qty: 0.014 }, { ingredientId: 'ing_sugar', qty: 0.012 }],
  },
  {
    id: 'mi_teh_tarik', name: 'Teh Tarik', category: 'Drinks', station: 'Bar', price: 4.5, popularity: 9.6, priceChangedAt: '2025-06-01',
    recipe: [{ ingredientId: 'ing_tea', qty: 0.012 }, { ingredientId: 'ing_condensed', qty: 0.11 }, { ingredientId: 'ing_sugar', qty: 0.008 }],
  },
  {
    id: 'mi_iced_latte', name: 'Iced Latte', category: 'Drinks', station: 'Bar', price: 12.0, popularity: 9.8, priceChangedAt: '2025-09-15',
    recipe: [{ ingredientId: 'ing_coffee', qty: 0.019 }, { ingredientId: 'ing_milk', qty: 0.2 }, { ingredientId: 'ing_syrup', qty: 0.008 }],
  },
  {
    id: 'mi_cappuccino', name: 'Hot Cappuccino', category: 'Drinks', station: 'Bar', price: 11.0, popularity: 5.4, priceChangedAt: '2025-09-15',
    recipe: [{ ingredientId: 'ing_coffee', qty: 0.018 }, { ingredientId: 'ing_milk', qty: 0.15 }],
  },
  {
    id: 'mi_matcha', name: 'Matcha Latte', category: 'Drinks', station: 'Bar', price: 14.5, popularity: 2.2, priceChangedAt: '2025-09-15',
    recipe: [{ ingredientId: 'ing_matcha', qty: 0.007 }, { ingredientId: 'ing_milk', qty: 0.22 }, { ingredientId: 'ing_syrup', qty: 0.01 }],
  },
  {
    id: 'mi_americano', name: 'Iced Americano', category: 'Drinks', station: 'Bar', price: 10.0, popularity: 4.8, priceChangedAt: '2025-09-15',
    recipe: [{ ingredientId: 'ing_coffee', qty: 0.018 }],
  },
  {
    id: 'mi_milo', name: 'Milo Dinosaur', category: 'Drinks', station: 'Bar', price: 9.5, popularity: 4.1, priceChangedAt: '2025-06-01',
    recipe: [{ ingredientId: 'ing_milo', qty: 0.05 }, { ingredientId: 'ing_milk', qty: 0.16 }, { ingredientId: 'ing_condensed', qty: 0.08 }],
  },
  {
    id: 'mi_orange_juice', name: 'Fresh Orange Juice', category: 'Drinks', station: 'Bar', price: 11.5, popularity: 2.0, priceChangedAt: '2025-02-01',
    recipe: [{ ingredientId: 'ing_orange', qty: 0.45 }, { ingredientId: 'ing_sugar', qty: 0.005 }],
  },
  {
    id: 'mi_sparkling', name: 'Sparkling Water', category: 'Drinks', station: 'Bar', price: 7.0, popularity: 1.1, priceChangedAt: '2024-08-01',
    recipe: [{ ingredientId: 'ing_packaging', qty: 1.6 }],
  },
  {
    id: 'mi_lava_cake', name: 'Chocolate Lava Cake', category: 'Desserts', station: 'Pastry', price: 15.9, popularity: 3.4, priceChangedAt: '2025-02-01',
    recipe: [
      { ingredientId: 'ing_chocolate', qty: 0.06 }, { ingredientId: 'ing_butter', qty: 0.03 }, { ingredientId: 'ing_egg', qty: 0.05 },
      { ingredientId: 'ing_flour', qty: 0.03 }, { ingredientId: 'ing_sugar', qty: 0.03 }, { ingredientId: 'ing_ice_cream', qty: 0.05 },
    ],
  },
  {
    id: 'mi_cheesecake', name: 'Cheesecake Slice', category: 'Desserts', station: 'Pastry', price: 14.9, popularity: 2.7, priceChangedAt: '2025-02-01',
    recipe: [
      { ingredientId: 'ing_cheese', qty: 0.085 }, { ingredientId: 'ing_cream', qty: 0.05 }, { ingredientId: 'ing_sugar', qty: 0.025 },
      { ingredientId: 'ing_flour', qty: 0.02 }, { ingredientId: 'ing_butter', qty: 0.015 },
    ],
  },
  {
    id: 'mi_kaya_toast', name: 'Pandan Kaya Toast', category: 'Desserts', station: 'Pastry', price: 7.9, popularity: 4.6, priceChangedAt: '2025-06-01',
    recipe: [{ ingredientId: 'ing_bread', qty: 0.12 }, { ingredientId: 'ing_kaya', qty: 0.03 }, { ingredientId: 'ing_butter', qty: 0.015 }],
  },
  {
    id: 'mi_sundae', name: 'Ice Cream Sundae', category: 'Desserts', station: 'Pastry', price: 12.9, popularity: 1.6, priceChangedAt: '2024-08-01',
    recipe: [
      { ingredientId: 'ing_ice_cream', qty: 0.16 }, { ingredientId: 'ing_chocolate', qty: 0.02 }, { ingredientId: 'ing_peanut', qty: 0.015 },
      { ingredientId: 'ing_cream', qty: 0.03 },
    ],
  },
  {
    id: 'mi_bottled_water', name: 'Bottled Water', category: 'Other', station: 'Bar', price: 3.0, popularity: 3.2, priceChangedAt: '2024-08-01',
    recipe: [{ ingredientId: 'ing_packaging', qty: 0.9 }],
  },
  {
    id: 'mi_takeaway', name: 'Takeaway Packaging', category: 'Other', station: 'Counter', price: 1.0, popularity: 5.5, priceChangedAt: '2025-01-01',
    recipe: [{ ingredientId: 'ing_packaging', qty: 1 }],
  },
]

export const EMPLOYEE_ROLES = ['Outlet Manager', 'Head Chef', 'Line Cook', 'Barista', 'Server', 'Cashier', 'Kitchen Helper']

/** hourlyRate in RM, contractHours per week. */
export const employees = [
  { id: 'emp_001', name: 'Nurul Aisyah', outletId: 'out_klcc', role: 'Outlet Manager', hourlyRate: 22.0, contractHours: 45, type: 'Full-time' },
  { id: 'emp_002', name: 'Hafiz Idris', outletId: 'out_klcc', role: 'Head Chef', hourlyRate: 19.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_003', name: 'Chong Wei Han', outletId: 'out_klcc', role: 'Line Cook', hourlyRate: 13.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_004', name: 'Priya Nair', outletId: 'out_klcc', role: 'Barista', hourlyRate: 12.5, contractHours: 40, type: 'Full-time' },
  { id: 'emp_005', name: 'Amir Zulkifli', outletId: 'out_klcc', role: 'Server', hourlyRate: 10.5, contractHours: 30, type: 'Part-time' },
  { id: 'emp_006', name: 'Tan Sze Ying', outletId: 'out_klcc', role: 'Server', hourlyRate: 10.5, contractHours: 30, type: 'Part-time' },
  { id: 'emp_007', name: 'Rosli Bin Ahmad', outletId: 'out_klcc', role: 'Kitchen Helper', hourlyRate: 9.5, contractHours: 40, type: 'Full-time' },
  { id: 'emp_008', name: 'Cheryl Lau', outletId: 'out_klcc', role: 'Cashier', hourlyRate: 10.0, contractHours: 36, type: 'Part-time' },

  { id: 'emp_009', name: 'Daniel Wong', outletId: 'out_subang', role: 'Outlet Manager', hourlyRate: 20.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_010', name: 'Siti Aminah', outletId: 'out_subang', role: 'Head Chef', hourlyRate: 18.0, contractHours: 45, type: 'Full-time' },
  { id: 'emp_011', name: 'Kumar Raj', outletId: 'out_subang', role: 'Line Cook', hourlyRate: 13.0, contractHours: 45, type: 'Full-time' },
  { id: 'emp_012', name: 'Elaine Ng', outletId: 'out_subang', role: 'Barista', hourlyRate: 12.0, contractHours: 40, type: 'Full-time' },
  { id: 'emp_013', name: 'Zulhelmi Kadir', outletId: 'out_subang', role: 'Server', hourlyRate: 10.0, contractHours: 30, type: 'Part-time' },
  { id: 'emp_014', name: 'Nadia Roslan', outletId: 'out_subang', role: 'Server', hourlyRate: 10.0, contractHours: 24, type: 'Part-time' },
  { id: 'emp_015', name: 'Lim Chun Kiat', outletId: 'out_subang', role: 'Kitchen Helper', hourlyRate: 9.5, contractHours: 40, type: 'Full-time' },

  { id: 'emp_016', name: 'Sharmila Devi', outletId: 'out_pj', role: 'Outlet Manager', hourlyRate: 19.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_017', name: 'Wong Kah Meng', outletId: 'out_pj', role: 'Head Chef', hourlyRate: 17.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_018', name: 'Farah Iman', outletId: 'out_pj', role: 'Line Cook', hourlyRate: 12.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_019', name: 'Joash Peter', outletId: 'out_pj', role: 'Barista', hourlyRate: 11.5, contractHours: 40, type: 'Full-time' },
  { id: 'emp_020', name: 'Aida Suraya', outletId: 'out_pj', role: 'Server', hourlyRate: 9.8, contractHours: 30, type: 'Part-time' },
  { id: 'emp_021', name: 'Ganesh Muthu', outletId: 'out_pj', role: 'Kitchen Helper', hourlyRate: 9.2, contractHours: 40, type: 'Full-time' },
  { id: 'emp_022', name: 'Yap Li Wen', outletId: 'out_pj', role: 'Cashier', hourlyRate: 9.8, contractHours: 30, type: 'Part-time' },

  { id: 'emp_023', name: 'Faiz Rahman', outletId: 'out_shahalam', role: 'Outlet Manager', hourlyRate: 19.0, contractHours: 45, type: 'Full-time' },
  { id: 'emp_024', name: 'Norhayati Ismail', outletId: 'out_shahalam', role: 'Head Chef', hourlyRate: 17.0, contractHours: 45, type: 'Full-time' },
  { id: 'emp_025', name: 'Adrian Fernandez', outletId: 'out_shahalam', role: 'Line Cook', hourlyRate: 12.5, contractHours: 45, type: 'Full-time' },
  { id: 'emp_026', name: 'Izzati Hamid', outletId: 'out_shahalam', role: 'Barista', hourlyRate: 11.5, contractHours: 40, type: 'Full-time' },
  { id: 'emp_027', name: 'Thinesh Kumar', outletId: 'out_shahalam', role: 'Server', hourlyRate: 9.8, contractHours: 30, type: 'Part-time' },
  { id: 'emp_028', name: 'Rina Marlina', outletId: 'out_shahalam', role: 'Kitchen Helper', hourlyRate: 9.2, contractHours: 36, type: 'Full-time' },
]

export const WASTE_REASONS = ['Expired', 'Spoilage', 'Preparation error', 'Customer return', 'Over-production', 'Damaged in delivery']

export const OPEX_CATEGORIES = ['Rent', 'Utilities', 'Marketing', 'Delivery platform fees', 'Other operating']

// Fast lookups used everywhere in the metrics layer.
export const outletById = Object.fromEntries(outlets.map((o) => [o.id, o]))
export const ingredientById = Object.fromEntries(ingredients.map((i) => [i.id, i]))
export const menuItemById = Object.fromEntries(menuItems.map((m) => [m.id, m]))
export const supplierById = Object.fromEntries(suppliers.map((s) => [s.id, s]))
export const employeeById = Object.fromEntries(employees.map((e) => [e.id, e]))
