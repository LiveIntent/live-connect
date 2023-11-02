import { ERRORS_CHANNEL } from 'live-connect-common'

export const EVENT_BUS_NAMESPACE = '__li__evt_bus'
// reexport for backwards compat
export const ERRORS_PREFIX = ERRORS_CHANNEL
export const PIXEL_SENT_PREFIX = 'lips'
export const PRELOAD_PIXEL = 'pre_lips'

export const PEOPLE_VERIFIED_LS_ENTRY = '_li_duid'

export const DEFAULT_IDEX_AJAX_TIMEOUT = 5000
export const DEFAULT_IDEX_URL = 'https://idx.liadm.com/idex'

export const DEFAULT_REQUESTED_ATTRIBUTES = [] // legacy behaviour; resolves nonId as unifiedId
