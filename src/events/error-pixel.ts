import { PixelSender } from '../pixel/sender'
import { StateWrapper } from '../pixel/state'
import * as page from '../enrichers/page'
import * as C from '../utils/consts'
import { ErrorDetails, EventBus, ICallHandler, IPixelSender, State } from '../types'

let _state = null
let _pixelSender: IPixelSender = null
const MAX_ERROR_FIELD_LENGTH = 120

const _defaultReturn: State = {
  errorDetails: {
    message: 'Unknown message',
    name: 'Unknown name'
  }
}

function _asInt (field: any): number | undefined {
  try {
    const intValue = field * 1
    return isNaN(intValue) ? undefined : intValue
  } catch {

  }
}

function _truncate (value: string): string {
  try {
    if (value && value.length && value.length > MAX_ERROR_FIELD_LENGTH) {
      return `${value.substr(0, MAX_ERROR_FIELD_LENGTH)}...`
    } else {
      return value
    }
  } catch {
  }
}

export function asErrorDetails (e: any): ErrorDetails {
  if (e) {
    return {
      errorDetails: {
        message: _truncate(e.message),
        name: _truncate(e.name),
        stackTrace: _truncate(e.stack),
        lineNumber: _asInt(e.lineNumber),
        lineColumn: _asInt(e.lineColumn),
        fileName: _truncate(e.fileName)
      }
    }
  } else {
    return _defaultReturn
  }
}

export function register (state: State, callHandler: ICallHandler, eventBus: EventBus): void {
  try {
    _pixelSender = new PixelSender(state, callHandler, eventBus)
    _state = state || {}

    eventBus.on(C.ERRORS_PREFIX, (error) => {
      console.log(error, _state)
      _pixelSender.sendPixel(new StateWrapper(asErrorDetails(error), eventBus).combineWith(_state || {}).combineWith(page.enrich({})))
    })
  } catch (e) {
    console.error('handlers.error.register', e)
  }
}
