import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

export const query = async (statement: string, params: unknown[] = []) => {
  const res = await pool.query(statement, params);
  return res;
};

export const client = async () => {
  const client = await pool.connect();
  const release = client.release;

  client.release = () => {
    // set the methods back to their old un-monkey-patched version
    client.release = release;

    // call the original release method on client
    return release.apply(client);
  };

  return client;
};
