export interface ShippingRule {
  country: string;
  province: string;
  district: string;
  shippingMethod: string;
  minWeight: number;
  maxWeight: number;
  price: number;
  active: boolean;
  rowIndex: number;
}


