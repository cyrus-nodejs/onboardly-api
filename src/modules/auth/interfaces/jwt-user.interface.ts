export interface JwtUser {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isSuperUser: boolean;
  organisationId: string;
}
