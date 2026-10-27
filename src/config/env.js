import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production').catch('production'),
  PORT: z.coerce.number().default(8000),
  MONGO_URI: z.string().default('mongodb+srv://InquisitiveAnuj:Inquisitive07Anuj@cluster0.ffoew59.mongodb.net/ID_CRM?retryWrites=true&w=majority'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().default('365crm_access_super_secret_key_2024_xyz'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('365crm_refresh_super_secret_key_2024_abc'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@365crm.com'),
  SEED_ADMIN_PASSWORD: z.string().default('ChangeMe@123'),
  SEED_ADMIN_NAME: z.string().default('Super Admin'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('⚠️  Environment variables warning:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
