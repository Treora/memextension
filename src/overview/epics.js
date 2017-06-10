import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'

import * as actions from './actions'


const searchUpdateActions = [
    actions.setQuery.getType(),
    actions.setStartDate.getType(),
    actions.setEndDate.getType(),
]

// When the query changed, refresh the search results
export const refreshSearchResultsUponQueryChange = action$ => action$
    .filter(action => searchUpdateActions.includes(action.type))
    .debounceTime(500) // wait until typing stops for 500ms
    .map(() => actions.refreshSearch({
        clearResults: true,
        loadingIndicator: true,
    }))
