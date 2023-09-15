import { CallHandler, EventBus } from "live-connect-common"
import { WrappedCallHandler } from "../handlers/call-handler"
import { Enricher } from "../types"

type Input = { callHandler: CallHandler, eventBus: EventBus }
type Output = { callHandler: WrappedCallHandler }

export const enrichCallHandler: Enricher<Input, Output> = state => {
  const callHandler = new WrappedCallHandler(state.callHandler, state.eventBus)
  return { ...state, callHandler }
}
