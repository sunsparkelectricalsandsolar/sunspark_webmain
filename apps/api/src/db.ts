import mariadb from "mariadb";
import { requireEnv } from "./env.js";

const databaseUrl = new URL(requireEnv("DATABASE_URL"));

export const pool = mariadb.createPool({
  host: databaseUrl.hostname,
  port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, ""),
  connectionLimit: Number(process.env.DB_POOL_SIZE ?? 5),
  timezone: "Z"
});

export async function query<T = Record<string, unknown>>(sql: string, values: unknown[] = []) {
  const connection = await pool.getConnection();

  try {
    return (await connection.query(sql, values)) as T[];
  } finally {
    connection.release();
  }
}

export async function execute(sql: string, values: unknown[] = []) {
  const connection = await pool.getConnection();

  try {
    return connection.query(sql, values);
  } finally {
    connection.release();
  }
}

export async function transaction<T>(work: (connection: Awaited<ReturnType<typeof pool.getConnection>>) => Promise<T>) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
