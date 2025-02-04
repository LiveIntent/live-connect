import { PixelSender } from '../pixel/sender.js'
import { StateWrapper } from '../pixel/state.js'
import { ERRORS_CHANNEL, ErrorDetails, isRecord, isString } from 'live-connect-common'
import { EventBus, State } from '../types.js'

const MAX_ERROR_FIELD_LENGTH = 120

function _asInt(field: unknown): number | undefined {
  try {
    const intValue = (field as number) * 1
    return isNaN(intValue) ? undefined : intValue
  } catch {

  }
}

function _truncate(value: unknown): string | undefined {
  try {
    if (isString(value) && value.length && value.length > MAX_ERROR_FIELD_LENGTH) {
      return `${value.substr(0, MAX_ERROR_FIELD_LENGTH)}...`
    } else {
      return `${value}`
    }
  } catch {
  }
}

export function asErrorDetails(e: unknown): ErrorDetails {
  if (isRecord(e)) {
    return {
      message: _truncate(e.message) || '',
      name: _truncate(e.name) || '',
      stackTrace: _truncate(e.stack),
      lineNumber: _asInt(e.lineNumber),
      columnNumber: _asInt(e.columnNumber),
      fileName: _truncate(e.fileName)
    }
  } else {
    return {
      message: 'Unknown message',
      name: 'Unknown name'
    }
  }
}

export function register(state: State, sender: PixelSender, eventBus: EventBus): void {
  try {
    eventBus.on(ERRORS_CHANNEL, (error) => {
      const wrapped = StateWrapper.fromError(state, asErrorDetails(error), eventBus)
      sender.sendPixel(wrapped)
    })
  } catch (e) {
    console.error('handlers.error.register', e)
  }
}
