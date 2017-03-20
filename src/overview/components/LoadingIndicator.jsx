import React from 'react'
import classNames from 'classnames'

import styles from './LoadingIndicator.css'

const LoadingIndicator = () => {
    return (
        <div className={styles.container}>
            <span className={classNames(styles.dotone, styles.dot)}></span>
            <span className={classNames(styles.dottwo, styles.dot)}></span>
            <span className={classNames(styles.dotthree, styles.dot)}></span>
        </div>
    )
}

export default LoadingIndicator
