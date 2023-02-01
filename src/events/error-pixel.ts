import { PixelSender } from '../pixel/sender'
import { StateWrapper } from '../pixel/state'
import * as page from '../enrichers/page'
import * as C from '../utils/consts'
import { EventBus, State } from '../types'
import { CallHandler } from '../handlers/call-handler'
import { isRecord, isString } from '../utils/types'

const MAX_ERROR_FIELD_LENGTH = 120

const _defaultReturn: State = {
  errorDetails: {
    message: 'Unknown message',
    name: 'Unknown name'
  }
}

function _asInt (field: unknown): number | undefined {
  try {
    const intValue = (field as number) * 1
    return isNaN(intValue) ? undefined : intValue
  } catch {

  }
}

function _truncate (value: unknown): string | undefined {
  try {
    if (isString(value) && value.length && value.length > MAX_ERROR_FIELD_LENGTH) {
      return `${value.substr(0, MAX_ERROR_FIELD_LENGTH)}...`
    } else {
      return `${value}`
    }
  } catch {
  }
}

export function asErrorDetails (e: unknown): State {
  if (isRecord(e)) {
    return {
      errorDetails: {
        message: _truncate(e.message) || '',
        name: _truncate(e.name) || '',
        stackTrace: _truncate(e.stack),
        lineNumber: _asInt(e.lineNumber),
        columnNumber: _asInt(e.columnNumber),
        fileName: _truncate(e.fileName)
      }
    }
  } else {
    return _defaultReturn
  }
}

export function register (state: State, callHandler: CallHandler, eventBus: EventBus): void {
  try {
    const pixelSender = new PixelSender(state, callHandler, eventBus)

    eventBus.on(C.ERRORS_PREFIX, (error) => {
      pixelSender.sendPixel(new StateWrapper(asErrorDetails(error), eventBus).combineWith(state || {}).combineWith(page.enrich({})))
    })
  } catch (e) {
    console.error('handlers.error.register', e)
  }
}
