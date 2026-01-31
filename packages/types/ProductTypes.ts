// types/products.ts

/**
 * Defines the structure of a product plan
 * @interface ProductPlan
 */
export interface ProductPlan {
    /** Stripe product ID */
    id: string;
    /** Environment indicator */
    env: 'test' | 'prod';
    /** Name of the plan */
    name: string;
    /** Billing interval */
    interval: 'month' | 'year';
    /** Plan description */
    description: string;
  }
  
  /**
   * Defines available plan IDs
   * @type PlanId
   */
  export type PlanId = 'base';
  
  /**
   * Maps plan IDs to their configurations
   * @interface PlanMapping
   */
  /**
 * Maps plan IDs to their configurations
 * @interface PlanMapping
 */
export type PlanMapping = {
    [key in PlanId]: ProductPlan;
};
  
  /**
   * Environment-specific product configurations
   * @interface ProductConfig
   */
  export interface ProductConfig {
    production: PlanMapping;
    development: PlanMapping;
  }