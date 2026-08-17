import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "askara_auth_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pkbm-askara-secure-jwt-secret-key-development-2026"
);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "bendahara" | "pendidik" | "siswa" | "orang_tua";
  activeRole?: "super_admin" | "admin" | "bendahara" | "pendidik" | "siswa" | "orang_tua";
  roles?: Array<"super_admin" | "admin" | "bendahara" | "pendidik" | "siswa" | "orang_tua">;
  managementPosition?: string | null; // e.g. "Kepala Bagian Kurikulum", "Bendahara / Finance"
  phone?: string | null;
  avatarUrl?: string | null;
  studentId?: string | null;
  parentId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJWT(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = payload as unknown as AuthUser;
    if (user && user.role) {
      user.role = String(user.role).toLowerCase() as AuthUser["role"];
    }
    return user;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}
