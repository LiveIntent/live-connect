import { EventBus } from "live-connect-common";
import { Enricher } from "../types";
import { register } from "../events/error-pixel";
import { WrappedCallHandler } from "../handlers/call-handler";

type Input = { eventBus: EventBus, domain: string, callHandler: WrappedCallHandler }

export const enrichErrorPixel: Enricher<Input, {}> = ({ eventBus, domain, callHandler }) => {
  register(eventBus, domain, callHandler)
}
