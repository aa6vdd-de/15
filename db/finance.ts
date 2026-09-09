import { env } from 'cloudflare:workers';
export function financeDb(){if(!env.DB)throw new Error('Finance database unavailable');return env.DB;}
