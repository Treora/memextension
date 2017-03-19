import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import configureStore from './store'
import overview from '../overview'

import './base.css'

// Include development tools if we are not building for production
let ReduxDevTools = undefined
if (process.env.NODE_ENV !== 'production') {
    ReduxDevTools = require('../dev/redux-devtools').default
}

// Set up the Redux store
const store = configureStore({ReduxDevTools})

store.dispatch(overview.actions.init())

// Render the UI to the screen
ReactDOM.render(
    <Provider store={store}>
        <div>
            <overview.components.Main />
            {ReduxDevTools && <ReduxDevTools />}
        </div>
    </Provider>,
    document.getElementById('app')
)
