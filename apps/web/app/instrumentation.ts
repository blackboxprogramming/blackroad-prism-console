import { registerOTel } from './otel-web';

export async function register() {
  if (typeof window !== 'undefined') {
    registerOTel();
  }
}
