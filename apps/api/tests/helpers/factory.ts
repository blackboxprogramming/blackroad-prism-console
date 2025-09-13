export function user(attrs: Partial<{email:string;name:string}> = {}){
  return { email: 'test@example.com', name: 'Test User', ...attrs };
}
