/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createRequire } from 'node:module';

const localRequire = createRequire(import.meta.url);
const requireFromBackendDefaults = createRequire(
  localRequire.resolve('@backstage/backend-defaults/package.json'),
);

type MigrationConfig = {
  schemaName?: string;
  tableName?: string;
};

type MigratorInstance = {
  knex: {
    client: {
      driverName?: string;
      config?: { client?: string };
      acquireConnection: () => Promise<{
        query: (sql: string, bindings: unknown[]) => Promise<unknown>;
      }>;
      releaseConnection: (connection: unknown) => Promise<unknown>;
      query: (
        connection: unknown,
        query: { sql: string; bindings: unknown[] },
      ) => Promise<unknown>;
    };
  };
  forceFreeMigrationsLock: (config?: MigrationConfig) => Promise<void>;
};

type LatestFn = (
  this: MigratorInstance,
  config?: MigrationConfig,
) => Promise<unknown>;

const ATTEMPTS_BEFORE_UNLOCK = 3;
const RETRY_DELAY_MS = 2000;

function isPostgres(migrator: MigratorInstance): boolean {
  return (
    migrator.knex.client.driverName === 'pg' ||
    migrator.knex.client.config?.client === 'pg'
  );
}

function isMigrationLocked(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const named = error as { name?: string; message?: string };
  return (
    named.name === 'MigrationLocked' ||
    named.message?.includes('Migration table is already locked') === true
  );
}

function lockKey(config: MigrationConfig | undefined): number {
  const name = `${config?.schemaName ?? ''}:${config?.tableName ?? 'knex_migrations'}`;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (Math.imul(hash, 31) + name.charCodeAt(i)) | 0;
  }
  return hash;
}

function lockLabel(config: MigrationConfig | undefined): string {
  return `${config?.schemaName ?? 'public'}.${config?.tableName ?? 'knex_migrations'}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function withAdvisoryLock<T>(
  migrator: MigratorInstance,
  key: number,
  fn: () => Promise<T>,
): Promise<T> {
  const connection = await migrator.knex.client.acquireConnection();
  try {
    await connection.query('SELECT pg_advisory_lock($1)', [key]);
    return await fn();
  } finally {
    try {
      await connection.query('SELECT pg_advisory_unlock($1)', [key]);
    } finally {
      await migrator.knex.client.releaseConnection(connection);
    }
  }
}

/**
 * Vercel starts a second container when several requests arrive together.
 * Knex refuses the migration lock immediately, and a container that dies
 * while holding it leaves the lock row set. Wait for the other container,
 * then release the lock once this process is the only one migrating.
 */
export function installMigrationLockGuard(): void {
  const Migrator = requireFromBackendDefaults(
    'knex/lib/migrations/migrate/Migrator',
  ) as { prototype: { latest: LatestFn & { __migrationLockGuard?: boolean } } };

  const originalLatest = Migrator.prototype.latest;
  if (originalLatest.__migrationLockGuard) {
    return;
  }

  const guardedLatest: LatestFn & { __migrationLockGuard?: boolean } =
    async function guardedLatest(this: MigratorInstance, config) {
      const run = () => originalLatest.call(this, config);
      if (!isPostgres(this)) {
        return run();
      }

      return withAdvisoryLock(this, lockKey(config), async () => {
        for (let attempt = 1; attempt <= ATTEMPTS_BEFORE_UNLOCK; attempt++) {
          try {
            return await run();
          } catch (error) {
            if (!isMigrationLocked(error)) {
              throw error;
            }
            if (attempt === ATTEMPTS_BEFORE_UNLOCK) {
              console.warn(
                `Releasing a stale migration lock for ${lockLabel(config)}`,
              );
              await this.forceFreeMigrationsLock(config);
              return run();
            }
            console.warn(
              `Migration table is locked for ${lockLabel(config)}; waiting for the other instance`,
            );
            await delay(RETRY_DELAY_MS);
          }
        }
        return run();
      });
    };
  guardedLatest.__migrationLockGuard = true;
  Migrator.prototype.latest = guardedLatest;
}
