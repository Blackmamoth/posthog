import { IconBox, IconBrackets, IconDocument, IconList, IconMagicWand } from '@posthog/icons'
import { LemonButton, LemonCard } from '@posthog/lemon-ui'
import { BindLogic, useActions, useValues } from 'kea'
import { errorPropertiesLogic, ErrorPropertiesLogicProps } from 'lib/components/Errors/errorPropertiesLogic'
import { ExceptionHeaderProps } from 'lib/components/Errors/StackTraces'
import { ErrorEventType } from 'lib/components/Errors/types'
import { ErrorTrackingException } from 'lib/components/Errors/types'
import { TZLabel } from 'lib/components/TZLabel'
import ViewRecordingButton, { mightHaveRecording } from 'lib/components/ViewRecordingButton/ViewRecordingButton'
import { IconSubtitles, IconSubtitlesOff } from 'lib/lemon-ui/icons'
import { ButtonGroupPrimitive } from 'lib/ui/Button/ButtonPrimitives'
import { cn } from 'lib/utils/css-classes'
import { useEffect } from 'react'
import { match } from 'ts-pattern'

import { ErrorTrackingRelationalIssue } from '~/queries/schema/schema-general'

import { Collapsible } from '../Collapsible'
import { ContextDisplay } from '../ContextDisplay'
import { ExceptionAttributesPreview } from '../ExceptionAttributesPreview'
import { ToggleButtonPrimitive } from '../ToggleButton/ToggleButton'
import { exceptionCardLogic } from './exceptionCardLogic'
import { FixModal } from './FixModal'
import { StacktraceBaseDisplayProps, StacktraceEmptyDisplay } from './Stacktrace/StacktraceBase'
import { StacktraceGenericDisplay } from './Stacktrace/StacktraceGenericDisplay'
import { StacktraceJsonDisplay } from './Stacktrace/StacktraceJsonDisplay'
import { StacktraceTextDisplay } from './Stacktrace/StacktraceTextDisplay'

// Helper function to check if any exception has resolved stack frames
function hasResolvedStackFrames(exceptionList: ErrorTrackingException[]): boolean {
    return exceptionList.some((exception) => {
        if (exception.stacktrace?.type === 'resolved' && exception.stacktrace?.frames) {
            return exception.stacktrace.frames.some((frame) => frame.resolved)
        }
        return false
    })
}

interface ExceptionCardContentProps {
    issue?: ErrorTrackingRelationalIssue
    issueLoading: boolean
    timestamp?: string
    label?: JSX.Element
}

export interface ExceptionCardProps extends Omit<ExceptionCardContentProps, 'timestamp'> {
    event?: ErrorEventType
    eventLoading: boolean
}

export function ExceptionCard({ issue, issueLoading, label, event, eventLoading }: ExceptionCardProps): JSX.Element {
    const { setLoading } = useActions(exceptionCardLogic)
    useEffect(() => {
        setLoading(eventLoading)
    }, [setLoading, eventLoading])
    return (
        <BindLogic
            logic={errorPropertiesLogic}
            props={
                {
                    properties: event?.properties,
                    timestamp: event?.timestamp,
                    id: issue?.id ?? 'error',
                } as ErrorPropertiesLogicProps
            }
        >
            <ExceptionCardContent
                issue={issue}
                label={label}
                timestamp={event?.timestamp}
                issueLoading={issueLoading}
            />
        </BindLogic>
    )
}

function ExceptionCardContent({ issue, issueLoading, timestamp, label }: ExceptionCardContentProps): JSX.Element {
    const { loading, showContext, isExpanded, showFixModal } = useValues(exceptionCardLogic)
    const { setShowFixModal } = useActions(exceptionCardLogic)
    const { properties, exceptionAttributes, additionalProperties, sessionId, exceptionList } =
        useValues(errorPropertiesLogic)
    const showFixButton = hasResolvedStackFrames(exceptionList)
    return (
        <LemonCard hoverEffect={false} className="group py-2 px-3 relative overflow-hidden">
            <Collapsible isExpanded={isExpanded} className="pb-1 flex w-full" minHeight="calc(var(--spacing) * 12)">
                <StacktraceIssueDisplay
                    className={cn('flex-grow', showContext && isExpanded ? 'w-2/3' : 'w-full')}
                    truncateMessage={!isExpanded}
                    issue={issue ?? undefined}
                    issueLoading={issueLoading}
                />
                <ContextDisplay
                    className={cn(showContext && isExpanded ? 'w-1/3 pl-2' : 'w-0')}
                    attributes={exceptionAttributes ?? undefined}
                    additionalProperties={additionalProperties}
                    loading={loading}
                />
            </Collapsible>
            <ExceptionCardActions className="absolute top-2 right-3 flex gap-2 items-center z-10">
                <ExceptionCardToggles />
            </ExceptionCardActions>
            <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1">
                    {label}
                    <ExceptionAttributesPreview attributes={exceptionAttributes} loading={loading} />
                </div>
                <ExceptionCardActions>
                    {timestamp && <TZLabel className="text-muted text-xs" time={timestamp} />}
                    {showFixButton && (
                        <LemonButton
                            icon={<IconMagicWand />}
                            size="xsmall"
                            type="secondary"
                            onClick={() => setShowFixModal(true)}
                            tooltip="Generate AI prompt to fix this error"
                        >
                            Fix
                        </LemonButton>
                    )}
                    <ViewRecordingButton
                        sessionId={sessionId}
                        timestamp={timestamp ?? undefined}
                        loading={loading}
                        inModal={true}
                        size="xsmall"
                        type="secondary"
                        disabledReason={mightHaveRecording(properties || {}) ? undefined : 'No recording available'}
                    />
                </ExceptionCardActions>
            </div>
            <FixModal isOpen={showFixModal} onClose={() => setShowFixModal(false)} />
        </LemonCard>
    )
}

function ExceptionCardToggles(): JSX.Element {
    const { showDetails, showAllFrames, showContext, showAsText, showAsJson } = useValues(exceptionCardLogic)
    const { setShowDetails, setShowAllFrames, setShowContext, setShowAsText, setShowAsJson } =
        useActions(exceptionCardLogic)
    return (
        <ButtonGroupPrimitive size="sm">
            <ToggleButtonPrimitive className="px-2" checked={showDetails} onCheckedChange={setShowDetails}>
                {showDetails ? (
                    <>
                        <IconSubtitlesOff />
                        Hide details
                    </>
                ) : (
                    <>
                        <IconSubtitles />
                        Show details
                    </>
                )}
            </ToggleButtonPrimitive>
            <ToggleButtonPrimitive iconOnly checked={showAsText} onCheckedChange={setShowAsText} tooltip="Show as text">
                <IconDocument />
            </ToggleButtonPrimitive>
            <ToggleButtonPrimitive iconOnly checked={showAsJson} onCheckedChange={setShowAsJson} tooltip="Show as json">
                <IconBrackets />
            </ToggleButtonPrimitive>
            <ToggleButtonPrimitive
                iconOnly
                checked={showAllFrames}
                onCheckedChange={setShowAllFrames}
                tooltip="Show vendor frames"
            >
                <IconBox />
            </ToggleButtonPrimitive>
            <ToggleButtonPrimitive
                iconOnly
                checked={showContext}
                onCheckedChange={setShowContext}
                tooltip="Show context"
            >
                <IconList />
            </ToggleButtonPrimitive>
        </ButtonGroupPrimitive>
    )
}

function ExceptionCardActions({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element {
    return (
        <div
            className={cn('flex justify-between items-center gap-1 bg-surface-primary', className)}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    )
}

function StacktraceIssueDisplay({
    issue,
    issueLoading,
    ...stacktraceDisplayProps
}: {
    issue?: ErrorTrackingRelationalIssue
    issueLoading: boolean
} & Omit<StacktraceBaseDisplayProps, 'renderLoading' | 'renderEmpty'>): JSX.Element {
    const { showAsText, showAsJson } = useValues(exceptionCardLogic)
    const componentProps = {
        ...stacktraceDisplayProps,
        renderLoading: (renderHeader: (props: ExceptionHeaderProps) => JSX.Element) =>
            renderHeader({
                type: issue?.name ?? undefined,
                value: issue?.description ?? undefined,
                loading: issueLoading,
            }),
        renderEmpty: () => <StacktraceEmptyDisplay />,
    }
    return match([showAsText, showAsJson])
        .with([false, false], () => <StacktraceGenericDisplay {...componentProps} />)
        .with([true, false], () => <StacktraceTextDisplay {...componentProps} />)
        .with([false, true], () => <StacktraceJsonDisplay {...componentProps} />)
        .otherwise(() => <></>)
}
