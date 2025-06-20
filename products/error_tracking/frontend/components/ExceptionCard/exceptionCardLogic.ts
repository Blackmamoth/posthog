import { actions, kea, listeners, path, reducers, selectors } from 'kea'

import type { exceptionCardLogicType } from './exceptionCardLogicType'

export const exceptionCardLogic = kea<exceptionCardLogicType>([
    path(() => ['scenes', 'error-tracking', 'exceptionCardLogic']),

    actions({
        setShowDetails: (showDetails: boolean) => ({ showDetails }),
        setShowAsText: (showAsText: boolean) => ({ showAsText }),
        setShowAsJson: (showAsJson: boolean) => ({ showAsJson }),
        setShowContext: (showContext: boolean) => ({ showContext }),
        setShowAllFrames: (showAllFrames: boolean) => ({ showAllFrames }),
        setLoading: (loading: boolean) => ({ loading }),
        setShowFixModal: (showFixModal: boolean) => ({ showFixModal }),
    }),

    reducers({
        showDetails: [
            true,
            {
                setShowDetails: (_, { showDetails }: { showDetails: boolean }) => showDetails,
            },
        ],
        showAsText: [
            false,
            {
                setShowAsJson: (prevState, { showAsJson }: { showAsJson: boolean }) => (showAsJson ? false : prevState),
                setShowAsText: (_, { showAsText }: { showAsText: boolean }) => showAsText,
            },
        ],
        showAsJson: [
            false,
            {
                setShowAsText: (prevState, { showAsText }: { showAsText: boolean }) => (showAsText ? false : prevState),
                setShowAsJson: (_, { showAsJson }: { showAsJson: boolean }) => showAsJson,
            },
        ],
        showAllFrames: [
            false,
            {
                setShowAllFrames: (_, { showAllFrames }: { showAllFrames: boolean }) => showAllFrames,
            },
        ],
        showContext: [
            true,
            { persist: true },
            {
                setShowContext: (_, { showContext }: { showContext: boolean }) => showContext,
            },
        ],
        loading: [
            true,
            {
                setLoading: (_, { loading }: { loading: boolean }) => loading,
            },
        ],
        showFixModal: [
            false,
            {
                setShowFixModal: (_, { showFixModal }: { showFixModal: boolean }) => showFixModal,
            },
        ],
    }),

    selectors({
        isExpanded: [
            (s) => [s.showDetails, s.loading],
            (showDetails: boolean, loading: boolean) => showDetails && !loading,
        ],
    }),

    listeners(({ actions }) => {
        return {
            setShowContext: () => actions.setShowDetails(true),
            setShowAllFrames: () => actions.setShowDetails(true),
        }
    }),
])
