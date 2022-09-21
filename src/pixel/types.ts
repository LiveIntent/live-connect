export interface pixelSender {
    sendAjax: (state: string) => void,
    sendPixel: (state: string) => void
}

export interface calls {
    ajaxGet: (string, fn: (any) => void, emitter: (any) => void, timeout: number) => void,
    pixelGet: (uri: string, onload?: any) => any
}

export interface stateWrapper {
    data: _state,
    combineWith: _combineWith,
    asQuery: _asQuery,
    asTuples: _asTuples,
    sendsPixel: _sendsPixel
}
