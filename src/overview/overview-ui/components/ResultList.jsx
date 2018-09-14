import React from 'react'
import PropTypes from 'prop-types'
import Waypoint from 'react-waypoint'
import moment from 'moment'

import { makeNonlinearTransform } from 'src/util/make-range-transform'
import { niceDate } from 'src/util/nice-time'

import PageAsListItem from './PageAsListItem'
import LoadingIndicator from './LoadingIndicator'
import styles from './ResultList.css'

// Map a time duration between log entries to a number of pixels between them.
const timeGapToSpaceGap = makeNonlinearTransform({
    // A gap of <5 mins gets no extra space, a >24 hours gap gets the maximum space.
    domain: [1000 * 60 * 5, 1000 * 60 * 60 * 24],
    // Minimum and maximum added space, in pixels.
    range: [0, 100],
    // Clamp excessive values to stay within the output range.
    clampOutput: true,
    // Use a logarithm to squeeze the larger numbers.
    nonlinearity: Math.log,
})

function computeRowGaps({ searchResult, endDate }) {
    // The space and possibly a time stamp before each row
    return searchResult.rows.map((row, rowIndex) => {
        // Space between two rows depends on the time between them.
        const prevRow = searchResult.rows[rowIndex - 1]
        const prevTimestamp = prevRow
            ? prevRow.doc.timestamp
            : endDate // a detail: the gap above the first result depends on the query's end date.
                ? endDate
                : Date.now()
        const timestamp = row.doc.timestamp
        const spaceGap = (timestamp && prevTimestamp)
            ? timeGapToSpaceGap(prevTimestamp - timestamp)
            : 0

        // On the day boundaries, we show the date.
        const dateString = niceDate(timestamp)
        const prevDateString = niceDate(prevTimestamp)
        const showDate = (dateString !== prevDateString)

        return {
            marginTop: spaceGap,
            dateStringToShow: showDate ? dateString : undefined,
        }
    })
}

function dateString(timestamp) {
    return moment(timestamp).format('DD-MM-YYYY')
}

const ResultList = ({
    searchResult,
    searchQuery,
    endDate,
    waitingForResults,
    onBottomReached,
}) => {
    // If there are no results, show a message.
    if (searchResult.rows.length === 0
        && searchQuery !== ''
        && !waitingForResults
    ) {
        return (
            <p className={styles.noResultMessage}>
                no results {endDate && `(up to ${dateString(endDate)})`}
            </p>
        )
    }

    const rowGaps = computeRowGaps({ searchResult, endDate })

    const listItems = searchResult.rows.map((row, rowIndex) => {
        const { marginTop, dateStringToShow } = rowGaps[rowIndex]

        const timestampComponent = dateStringToShow && (
            <time
                className={styles.timestamp}
                dateTime={new Date(row.doc.timestamp)}
                style={{
                    height: 16,
                    fontSize: 16,
                }}
            >
                {dateStringToShow}
            </time>
        )

        return (
            <li
                key={row.doc._id}
                style={{ marginTop }}
            >
                <div>
                    {timestampComponent}
                    <PageAsListItem
                        doc={row.doc}
                    />
                </div>
            </li>
        )
    })

    // Insert waypoint to trigger loading new items when scrolling down.
    if (!waitingForResults && !searchResult.resultsExhausted) {
        const waypoint = <Waypoint onEnter={onBottomReached} key='waypoint' />
        // Put the waypoint a bit before the bottom, except if the list is short.
        const waypointPosition = Math.max(Math.min(5, listItems.length), listItems.length - 5)
        listItems.splice(waypointPosition, 0, waypoint)
    }

    return (
        <ul className={styles.root}>
            {endDate && (
                <li className={styles.skippingToDateMessage}>
                    …skipping snapshots made after {dateString(endDate)}…
                </li>
            )}
            {listItems}
            {waitingForResults && <LoadingIndicator />}
        </ul>
    )
}

ResultList.propTypes = {
    searchResult: PropTypes.object,
    searchQuery: PropTypes.string,
    waitingForResults: PropTypes.bool,
    onBottomReached: PropTypes.func,
}

export default ResultList
