import { app } from '../src/app'

export const onRequest = (context: any) => {
  const url = new URL(context.request.url)
  const pathname = url.pathname

  // 让 Pages 静态资源按平台默认方式提供，避免被 Hono catch-all 拦截
  const isStaticAsset =
    pathname.startsWith('/css/') ||
    pathname.startsWith('/js/') ||
    pathname === '/favicon.ico' ||
    /\.(css|js|ico|png|jpg|jpeg|svg|webp|gif|map|txt|xml)$/i.test(pathname)

  if (isStaticAsset) {
    return context.next()
  }

  return app.fetch(context.request, context.env, context)
}
