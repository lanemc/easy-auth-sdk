import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { schema } from './schema'
import { DatabaseError } from '../types'

export class Database {
  public db: ReturnType<typeof drizzle>
  private client: postgres.Sql

  constructor(connectionString: string) {
    try {
      this.client = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      })
      
      this.db = drizzle(this.client, { schema })
    } catch (error) {
      throw new DatabaseError(
        `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async testConnection(): Promise<void> {
    try {
      await this.client`SELECT 1`
    } catch (error) {
      throw new DatabaseError(
        `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async migrate(migrationsFolder: string = './drizzle'): Promise<void> {
    try {
      await migrate(this.db, { migrationsFolder })
    } catch (error) {
      throw new DatabaseError(
        `Database migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.end()
    } catch (error) {
      throw new DatabaseError(
        `Failed to close database connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Utility method to create tables if they don't exist
  async ensureTablesExist(): Promise<void> {
    try {
      // Check if users table exists
      const result = await this.client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `
      
      if (!result[0]?.exists) {
        throw new DatabaseError(
          'Database tables do not exist. Please run migrations or ensure the database is properly set up.'
        )
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(
        `Failed to verify database tables: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.db
        .delete(schema.sessions)
        .where(sql`expires_at < NOW()`)
        .returning({ id: schema.sessions.id })
        
      return result.length
    } catch (error) {
      throw new DatabaseError(
        `Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Cleanup expired verification tokens
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.db
        .delete(schema.verificationTokens)
        .where(sql`expires_at < NOW()`)
        .returning({ id: schema.verificationTokens.id })
        
      return result.length
    } catch (error) {
      throw new DatabaseError(
        `Failed to cleanup expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// Import sql from drizzle-orm for raw queries
import { sql } from 'drizzle-orm'