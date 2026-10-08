export const DEMO_ACCOUNT_EMAILS = ['admin@moneyflow.vn', 'hoang@moneyflow.vn', 'lan@moneyflow.vn'];
export const isDemoAccountEmail = (email: string) => DEMO_ACCOUNT_EMAILS.includes(String(email).trim().toLowerCase());
