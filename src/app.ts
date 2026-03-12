import { Hono } from 'hono'
import { renderer } from './renderer'
import { cors } from 'hono/cors'

import { DatabaseService } from './services/database'
import { AuthService } from './services/auth'

import {
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  corsConfig,
  rateLimitMiddleware
} from './middleware/auth'

import { authRoutes } from './routes/auth'
import { apiRoutes } from './routes/api'
import { telegramRoutes } from './routes/telegram'
import { pageRoutes } from './routes/pages'
import { internalRoutes } from './routes/internal'

export type Bindings = {
  DB: D1Database
  ENVIRONMENT?: string
  POLL_SECRET?: string
}

export type Variables = {
  dbService: DatabaseService
  authService: AuthService
}

export function createApp() {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

  // 最小诊断接口：用于线上确认 Worker 已运行以及关键绑定是否存在
  app.get('/__diag', (c) => {
    return c.json({
      ok: true,
      timestamp: new Date().toISOString(),
      bindings: {
        hasDB: !!c.env.DB,
        hasPollSecret: !!c.env.POLL_SECRET,
        environment: c.env.ENVIRONMENT || null
      }
    })
  })

  app.use('*', errorHandlerMiddleware)
  app.use('*', requestLoggerMiddleware)
  app.use('*', cors(corsConfig))
  app.use('*', rateLimitMiddleware(200, 60000))
  app.use(renderer)

  app.use('*', async (c, next) => {
    const dbService = new DatabaseService(c.env.DB)
    const authService = new AuthService(dbService)

    c.set('dbService', dbService)
    c.set('authService', authService)

    await next()
  })

  app.route('/auth', authRoutes)
  app.route('/api', apiRoutes)
  app.route('/telegram', telegramRoutes)
  app.route('/internal', internalRoutes)
  app.route('/', pageRoutes)

  return app
}

export const app = createApp()
