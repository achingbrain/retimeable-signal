/* eslint-env mocha */

import { expect } from 'aegir/chai'
import delay from 'delay'
import { pEvent } from 'p-event'
import { retimeableSignal } from '../src/index.js'

describe('retimer-signal', () => {
  it('should create a signal that aborts', async () => {
    const signal = retimeableSignal(100)

    await pEvent(signal, 'abort')
  })

  it('should reset a signal', async () => {
    const signal = retimeableSignal(10)
    signal.reset(100)

    const start = Date.now()
    await pEvent(signal, 'abort')
    const finish = Date.now() - start

    expect(finish).to.be.greaterThan(11)
  })

  it('should clear a signal', async () => {
    const signal = retimeableSignal(10)
    signal.clear()

    await delay(100)

    expect(signal.aborted).to.be.false()
  })
})
