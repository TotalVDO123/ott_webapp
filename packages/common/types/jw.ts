export type JwListResponse<N extends string = string, T extends Record<string, any> = Record<string, any>> = {
  page: number;
  total: number;
  page_length: number;
} & {
  [P in N]: T[];
};

export type PlanPrice = {
  id: string;
  access: {
    period: 'month' | 'year';
    quantity: number;
    type: 'subscription';
  };
  metadata: {
    amount: number;
    currency: string;
    name: string;
    trial?: { period: 'day'; quantity: number } | null;
  };
  original_id: number;
  relationships: {
    plans: { id: string; type: 'plan' }[];
  };
  schema: string;
  type: 'price';
};

export type JwPlanPricesResponse = JwListResponse<'prices', PlanPrice>;
