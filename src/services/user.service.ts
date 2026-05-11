import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB — giới hạn thấp hơn vì lưu vào DB

export class UserServiceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function registerUser(name: string, email: string, password: string) {
  if (!name || !email || !password) throw new UserServiceError("Missing fields", 400);
  if (password.length < 6) throw new UserServiceError("Password must be at least 6 characters", 400);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new UserServiceError("Email already registered", 409);

  const hashed = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true },
  });
}

export async function updateProfile(userId: string, data: { name?: string; bio?: string; country?: string }) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function uploadAvatar(userId: string, file: File) {
  if (!ALLOWED_TYPES.includes(file.type))
    throw new UserServiceError("Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF", 400);
  if (file.size > MAX_SIZE)
    throw new UserServiceError("Ảnh tối đa 2MB", 400);

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const imageUrl = `data:${file.type};base64,${base64}`;

  await prisma.user.update({ where: { id: userId }, data: { image: imageUrl } });
  return imageUrl;
}
