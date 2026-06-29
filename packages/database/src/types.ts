export interface DatabaseConfig {
  /** PostgreSQL connection string */
  url: string;
  /** Enable query logging */
  logging?: boolean;
  /** Connection pool size */
  poolSize?: number;
}
