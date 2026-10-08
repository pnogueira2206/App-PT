// Creates (or resets the password of) a trainer account.
// Usage: npm run create-trainer -- "Nome" email@exemplo.com palavra-passe
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [name, rawEmail, password] = process.argv.slice(2);
  if (!name || !rawEmail || !password) {
    console.error('Uso: npm run create-trainer -- "Nome" email@exemplo.com palavra-passe');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("A palavra-passe deve ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "TRAINER") {
    console.error("Já existe um aluno com este email.");
    process.exit(1);
  }

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash, role: "TRAINER" },
  });
  console.log(`Conta de treinador pronta: ${email}`);
}

main().finally(() => prisma.$disconnect());
