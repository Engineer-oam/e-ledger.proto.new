
import { ProductionOrder, InventoryItem, SaleOrder, User, Sector } from '../types';

const STORAGE_KEYS = {
  PRODUCTION: 'erp_production_orders',
  INVENTORY: 'erp_inventory',
  SALES: 'erp_sales'
};

export const ERPService = {
  getProductionOrders: (user: User): ProductionOrder[] => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.PRODUCTION}_${user.gln}`);
    if (stored) return JSON.parse(stored);
    
    const initial: ProductionOrder[] = [
      { 
        id: 'PO-1001', 
        productName: user.sector === Sector.PHARMA ? 'Amoxicillin 500mg' : 'Premium Reserve', 
        plannedQty: 5000, 
        actualQty: 4800, 
        startDate: new Date().toISOString(), 
        status: 'COMPLETED',
        sectorSpecifics: user.sector === Sector.EXCISE ? { abv: 42.8, vatId: 'V-09' } : { temp: '25C', batchCode: 'ST-01' }
      }
    ];
    localStorage.setItem(`${STORAGE_KEYS.PRODUCTION}_${user.gln}`, JSON.stringify(initial));
    return initial;
  },

  createProductionOrder: (user: User, order: Partial<ProductionOrder>): ProductionOrder => {
    const orders = ERPService.getProductionOrders(user);
    const newOrder: ProductionOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      productName: order.productName || 'New Product',
      plannedQty: order.plannedQty || 0,
      actualQty: 0,
      startDate: new Date().toISOString(),
      status: 'PENDING',
      sectorSpecifics: order.sectorSpecifics || {}
    };
    orders.unshift(newOrder);
    localStorage.setItem(`${STORAGE_KEYS.PRODUCTION}_${user.gln}`, JSON.stringify(orders));
    return newOrder;
  },

  updateProductionStatus: (user: User, id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', actualQty?: number) => {
    const orders = ERPService.getProductionOrders(user);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      if (actualQty !== undefined) orders[index].actualQty = actualQty;
      localStorage.setItem(`${STORAGE_KEYS.PRODUCTION}_${user.gln}`, JSON.stringify(orders));
    }
  },

  getInventory: (user: User): InventoryItem[] => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.INVENTORY}_${user.gln}`);
    if (stored) return JSON.parse(stored);

    const initial: InventoryItem[] = [
      { id: 'SKU-01', name: 'Standard Packaging 1L', sku: 'PKG-100', stockLevel: 1200, minLevel: 200, unit: 'pcs' },
      { id: 'SKU-02', name: 'Raw Material Blend A', sku: 'RAW-500', stockLevel: 45, minLevel: 10, unit: 'kg' }
    ];
    localStorage.setItem(`${STORAGE_KEYS.INVENTORY}_${user.gln}`, JSON.stringify(initial));
    return initial;
  },

  updateInventoryLevel: (user: User, sku: string, adjustment: number) => {
    const inv = ERPService.getInventory(user);
    const item = inv.find(i => i.sku === sku);
    if (item) {
      item.stockLevel += adjustment;
      localStorage.setItem(`${STORAGE_KEYS.INVENTORY}_${user.gln}`, JSON.stringify(inv));
    }
  },

  getSales: (user: User): SaleOrder[] => {
    const stored = localStorage.getItem(`${STORAGE_KEYS.SALES}_${user.gln}`);
    if (stored) return JSON.parse(stored);

    const initial: SaleOrder[] = [
      { 
        id: 'SO-9923', 
        customerName: 'Regional Distributor Alpha', 
        totalAmount: 145000, 
        date: new Date().toISOString(),
        items: [{ name: 'Mixed Cases', qty: 10, price: 14500 }],
        syncStatus: 'SYNCED'
      }
    ];
    localStorage.setItem(`${STORAGE_KEYS.SALES}_${user.gln}`, JSON.stringify(initial));
    return initial;
  },

  createSale: (user: User, sale: Partial<SaleOrder>): SaleOrder => {
    const sales = ERPService.getSales(user);
    const newSale: SaleOrder = {
      id: `SO-${Date.now().toString().slice(-4)}`,
      customerName: sale.customerName || 'Walk-in Customer',
      totalAmount: sale.totalAmount || 0,
      date: new Date().toISOString(),
      items: sale.items || [],
      syncStatus: 'PENDING'
    };
    sales.unshift(newSale);
    localStorage.setItem(`${STORAGE_KEYS.SALES}_${user.gln}`, JSON.stringify(sales));
    return newSale;
  },

  checkConnection: async (user: User): Promise<'CONNECTED' | 'DISCONNECTED' | 'PENDING'> => {
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    // Logic: Manual ERP is always "connected", others simulate a healthy response
    return 'CONNECTED';
  }
};
