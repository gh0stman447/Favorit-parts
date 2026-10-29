export type Warehouse = {
  code?: string;
  id?: string;
  price?: number;
  stock?: number;
};

export type ApiGood = {
  goodsID?: string;
  brand?: string;
  number?: string;
  name?: string;
  count?: number;
  warehouses?: Warehouse[];
  analogues?: ApiGood[];
};

export type ApiResponse = { goods?: ApiGood[]; error?: string | string[] };

export type Offer = {
  goodsID?: string;
  brand?: string;
  number?: string;
  name?: string;
  warehouse?: string;
  warehouseId?: string;
  price: number | null;
  stock: number;
};

export type PartsState = {
  brands: string[];
  offers: Offer[];
  searchedNumber: string;
  selectedBrand: string;
  status: 'idle' | 'brandsLoading' | 'brandsSucceeded' | 'offersLoading' | 'offersSucceeded' | 'failed';
  error: string | null;
};
