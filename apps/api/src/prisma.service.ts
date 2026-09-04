import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

/**
 * Returns a Prisma driver adapter when running against Turso/libSQL.
 * Local SQLite (`file:...`) keeps the default engine — zero setup.
 */
export function tursoAdapter() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.startsWith('libsql:')) return undefined;
  return new PrismaLibSql({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = tursoAdapter();
    super(adapter ? { adapter } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
