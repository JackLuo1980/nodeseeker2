import type { Bindings } from '../app'
import { DatabaseService } from './database'
import { RSSService } from './rss'
import { TelegramService } from './telegram'
import { MatcherService } from './matcher'

export interface PollRunResult {
  ok: boolean
  trigger: 'cron' | 'manual'
  rss: { processed: number; new: number; errors: number }
  push: { processed: number; pushed: number; skipped: number; errors: number } | null
  cleanupDeleted: number
  skippedReason?: string
}

export async function runFeedPolling(
  env: Bindings,
  trigger: 'cron' | 'manual'
): Promise<PollRunResult> {
  const dbService = new DatabaseService(env.DB)
  const config = await dbService.getBaseConfig()

  if (!config || !config.bot_token) {
    console.log('系统未配置，跳过 RSS 抓取任务')
    return {
      ok: true,
      trigger,
      rss: { processed: 0, new: 0, errors: 0 },
      push: null,
      cleanupDeleted: 0,
      skippedReason: 'system_not_configured'
    }
  }

  const rssService = new RSSService(dbService)
  const telegramService = new TelegramService(dbService, config.bot_token)
  const matcherService = new MatcherService(dbService, telegramService)

  console.log(`开始执行轮询任务，触发方式: ${trigger}`)

  const rssResult = await rssService.processNewRSSData()
  console.log(`RSS 抓取完成: 新增 ${rssResult.new} 篇文章`)

  let pushResult: PollRunResult['push'] = null
  if (rssResult.new > 0) {
    pushResult = await matcherService.processUnpushedPosts()
    console.log(`推送完成: 推送 ${pushResult.pushed} 篇文章`)
  }

  const cleanupResult = await dbService.cleanupOldPosts()
  console.log(`数据清理完成: 删除了 ${cleanupResult.deletedCount} 条过期记录`)

  return {
    ok: true,
    trigger,
    rss: rssResult,
    push: pushResult,
    cleanupDeleted: cleanupResult.deletedCount
  }
}
