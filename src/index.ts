/**
 * @packageDocumentation
 *
 * This module exports a `retimeableSignal` function that returns an
 * `AbortSignal` that fires an "abort" event after a specified number of ms.
 *
 * It has been augmented with two additional methods `reset` and `clear` which
 * change the timeout time and prevent it from firing entirely.
 *
 * @example
 *
 * ```TypeScript
 * import { retimeableSignal } from 'retimeable-signal'
 *
 * const signal = retimeableSignal(100)
 *
 * //... time passes, reset timeout to now + 100ms
 * signal.reset(100)
 *
 * // stop the signal from aborting at all
 * signal.clear()
 * ```
 *
 * ## Prior art
 *
 * This is module is inspired by the [retimer](https://www.npmjs.com/package/retimer)
 * module except that uses `setTimeout` which can cause a Node.js process to
 * stay open, this uses `AbortSignal.timeout` which does not.
 */

/**
 * An abort error class that extends error
 */
class AbortError extends Error {
  public type: string
  public code: string | string

  constructor (message?: string, code?: string, name?: string) {
    super(message ?? 'The operation was aborted')
    this.type = 'aborted'
    this.name = name ?? 'AbortError'
    this.code = code ?? 'ABORT_ERR'
  }
}

export interface RetimerSignalOptions {
  /**
   * The message for the error thrown if the signal aborts
   */
  errorMessage?: string

  /**
   * The code for the error thrown if the signal aborts
   */
  errorCode?: string

  /**
   * The name for the error thrown if the signal aborts
   */
  errorName?: string
}

/**
 * An extension to the `AbortSignal` interface that allows resetting the timer
 * after which the signal will fire it's "abort" event.
 */
export interface RetimeableAbortSignal extends AbortSignal {
  /**
   * Reset the timer. If `ms` is specified, the timer will fire this many ms in
   * the future, otherwise it will fire according to the `ms` arg originally
   * passed to `retimerSignal`.
   */
  reset(ms?: number): void

  /**
   * Clear the timer, the "abort" event will no longer be fired
   */
  clear(): void
}

/**
 * Return an AbortSignal that times out after a specified number of ms with an
 * internal timer that can be reset to fire further into the future or cleared
 * entirely
 */
export function retimeableSignal (ms: number, opts?: RetimerSignalOptions): RetimeableAbortSignal {
  // create the error here so we have more context in the stack trace
  const error = new AbortError(opts?.errorMessage, opts?.errorCode, opts?.errorName)
  const controller = new AbortController()
  const abortHandler = (): void => {
    controller.abort(error)
  }

  let signal: AbortSignal | undefined = AbortSignal.timeout(ms)
  signal.addEventListener('abort', abortHandler)

  const retimerSignal = controller.signal as any
  retimerSignal.reset = (newMs?: number): void => {
    signal?.removeEventListener('abort', abortHandler)
    signal = AbortSignal.timeout(newMs ?? ms)
    signal.addEventListener('abort', () => {
      controller.abort(error)
    })
  }
  retimerSignal.clear = (): void => {
    signal?.removeEventListener('abort', abortHandler)
    signal = undefined
  }

  return retimerSignal satisfies RetimeableAbortSignal
}
