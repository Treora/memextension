import Rx from 'rxjs'
import noop from 'lodash/noop'

import State from './promise-batcher-state'

/**
 * Given a Set of input and an async function, will attempt to concurrently batch process them in the background.
 *
 * @param {Iterable<any>} inputBatch The total batch of input to operate on.
 * @param {(input: any) => Promise<any>} callback The callback to run each input on. Should be
 *          an async/promise-returning function.
 * @param {number} [concurrency=5] How many promises to be waiting at any time.
 * @returns {any} Object containing batch handling functions.
 */
function initBatch({
    inputBatch,
    asyncCallback,
    concurrency = 5,
    observer: { next = noop, error = noop, complete = noop } = {},
}) {
    const state = new State() // State to keep track of progress
    let sub // State to keep track of subscription (allow hiding of Rx away from caller)

    /**
     * Subscribes to Observable built on the batch input. It uses state to track which inputs
     * have been processed already, and filters new input against the state (to make
     * sure it isn't a dupe or if it was already processed on a previous invocation).
     */
    const subBatchObservable = () => {
        // Given an input, defers the async callback and handles any errors
        const inputDeferer = input => Rx.Observable.defer(() => asyncCallback(input))
                .catch(err => {
                    state.recordFailure(input, err.message)
                    error(err)  // Note we're using the observer's onError callback here to not stop stream
                    return Rx.Observable.empty() // Empty obs to ignore error and continue stream
                })

        return Rx.Observable.from(inputBatch)
            .filter(input => !state.has(input))  // Ignore already-processed values
            .mergeMap(
                inputDeferer, // Defer async callbacks on input...
                (input, output) => ({ input, output }),
                concurrency)  // ...but run this many at any time
            .do(({ input }) => {
                console.log(`${state.getState().length} processed out of ${inputBatch.length}`)
                state.recordSuccess(input)
            })  // Update state as input gets processed
            .subscribe(next, noop, complete)
    }

    // Interface to use this batch
    return {
        /**
         * Starts/resumes the batched processing on the input.
         * @returns {boolean} Denotes whether or not batch could be started/resumed.
         */
        start() {
            if (sub) { return false }
            sub = subBatchObservable() // Create new sub to an observable doing the processing
            return true
        },
        /**
         * Terminates a running batch. Resets state so that the next start() call will start from the
         * beginning of input.
         * @returns {boolean} Denotes whether or not batch could be terminated.
         */
        stop() {
            if (!sub) { return false }
            state.reset() // Reset state so it can't be resumed
            sub.unsubscribe() // Unsub to end observable processing
            sub = undefined // Explicitly remove pointer to old observable sub
            return true
        },
        /**
         * Pauses a running batch. Persists state so that the next start() call will ignore previously
         * processed inputs.
         * @returns {boolean} Denotes whether or not batch could be paused.
         */
        pause() {
            if (!sub) { return false }
            sub.unsubscribe() // Unsub to end observable processing (state still saved)
            sub = undefined
            return true
        },
        /**
         * @returns {Array<any>} The Array of inputs that have already been processed.
         */
        getState: () => state.getState(),
    }
}

// Export a function that binds async callbacks to a batch initialser
export default initBatch
