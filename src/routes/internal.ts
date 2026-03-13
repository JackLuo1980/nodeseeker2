import { Hono } from 'hono'
import type { Bindings, Variables } from '../app'
import { runFeedPolling } from '../services/poller'

export const internalRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

function isAuthorized(c: any): boolean {
  const secret = c.env.POLL_SECRET?.trim()
  if (!secret) {
    // Pages 未配置密钥时，退化为允许外部直接触发，优先保证轮询可用
    return true
  }

  const authHeader = c.req.header('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : null
  const headerToken = c.req.header('X-Poll-Secret')?.trim()

  return bearerToken === secret || headerToken === secret
}

internalRoutes.post('/poll', async (c) => {
  if (!isAuthorized(c)) {
    return c.json({
      success: false,
      message: '未授权访问内部轮询接口'
    }, 401)
  }

  try {
    const result = await runFeedPolling(c.env, 'manual')
    return c.json({
      success: true,
      message: '轮询执行完成',
      data: result
    })
  } catch (error) {
    console.error('内部轮询执行失败:', error)
    return c.json({
      success: false,
      message: `轮询执行失败: ${error}`
    }, 500)
  }
})
