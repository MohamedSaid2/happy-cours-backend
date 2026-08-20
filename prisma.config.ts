import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://happy_cours_db_user:CzGgxpXOtzkfWwZLexGEixAwvQoVbEIt@dpg-da0o8f8jo6nc73f157n0-a.frankfurt-postgres.render.com/happy_cours_db?sslmode=require",
  },
});