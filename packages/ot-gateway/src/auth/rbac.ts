export type Principal = {
  id: string;
  roles: string[];
};

export function assertRole(principal: Principal | undefined, role: string) {
  if (!principal || !principal.roles.includes(role)) {
    throw new Error(`missing role: ${role}`);
  }
}
