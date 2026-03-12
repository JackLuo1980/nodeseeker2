import { app, type Bindings } from './app'
import { runFeedPolling } from './services/poller'

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    }
  }

  return {
    message: String(error)
  }
}

// 定时任务处理器
export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    try {
      return await app.fetch(request, env, ctx)
    } catch (error) {
      const formatted = formatError(error)
      console.error('顶层请求处理失败:', formatted.message, formatted.stack || '')

      return new Response(
        JSON.stringify({
          success: false,
          message: formatted.message,
          stack: formatted.stack || null,
          path: new URL(request.url).pathname,
          hint: '请先访问 /__diag 确认 DB 绑定是否存在'
        }),
        {
          status: 500,
          headers: {
            'content-type': 'application/json; charset=UTF-8'
          }
        }
      )
    }
  },

  // 定时任务处理器
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const cronExpression = event.cron.trim()
    console.log(`开始执行定时任务，cron: ${cronExpression}`)

    try {
      await runFeedPolling(env, 'cron')
    } catch (error) {
      console.error('定时任务执行失败:', error)
    }
  }
}
