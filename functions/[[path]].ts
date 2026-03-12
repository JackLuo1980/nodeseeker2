import { app } from '../src/app'

export const onRequest = (context: any) => {
  return app.fetch(context.request, context.env, context)
}
