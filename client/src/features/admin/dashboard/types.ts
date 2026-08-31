export type AdminDashboardLite = {
  totalProducts: number;
  totalCategories: number;
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
};

export type DashboardDailyPoint = {
  date: string;
  label: string;
  orders: number;
  sales: number;
};

export type AdminDashboardDaily = {
  days: DashboardDailyPoint[];
};
