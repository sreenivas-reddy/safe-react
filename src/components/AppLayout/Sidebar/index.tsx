import { lazy, useMemo } from 'react'
import styled from 'styled-components'
import { Divider } from '@gnosis.pm/safe-react-components'

import List, { ListItemType, StyledListItem, StyledListItemText } from 'src/components/List'
import SafeHeader from './SafeHeader'
import { IS_PRODUCTION } from 'src/utils/constants'
import { wrapInSuspense } from 'src/utils/wrapInSuspense'
import ListIcon from 'src/components/List/ListIcon'

const StyledDivider = styled(Divider)`
  margin: 16px -8px 0;
`

const HelpContainer = styled.div`
  margin-top: auto;
`

const HelpList = styled.div`
  margin: 24px 0;
`

const HelpCenterLink = styled.a`
  width: 100%;
  display: flex;
  position: relative;
  box-sizing: border-box;
  text-align: left;
  align-items: center;
  padding: 8px 16px;
  justify-content: flex-start;
  text-decoration: none;
  border-radius: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
  p {
    font-family: ${({ theme }) => theme.fonts.fontFamily};
    font-size: 0.76em;
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: 1px;
    color: ${({ theme }) => theme.colors.placeHolder};
    text-transform: uppercase;
    padding: 0 0 0 4px;
  }
`
type Props = {
  safeAddress?: string
  safeName?: string
  balance?: string
  granted: boolean
  onToggleSafeList: () => void
  onReceiveClick: () => void
  onNewTransactionClick: () => void
  items: ListItemType[]
}

// This doesn't play well if exported to its own file
const lazyLoad = (path: string): React.ReactElement => {
  // import(path) does not work unless it is a template literal
  const Component = lazy(() => import(`${path}`))
  return wrapInSuspense(<Component />)
}

const Sidebar = ({
  items,
  balance,
  safeAddress,
  safeName,
  granted,
  onToggleSafeList,
  onReceiveClick,
  onNewTransactionClick,
}: Props): React.ReactElement => {
  const devTools = useMemo(() => lazyLoad('./DevTools'), [])
  const debugToggle = useMemo(() => lazyLoad('./DebugToggle'), [])
  return (
    <>
      <SafeHeader
        address={safeAddress}
        safeName={safeName}
        granted={granted}
        balance={balance}
        onToggleSafeList={onToggleSafeList}
        onReceiveClick={onReceiveClick}
        onNewTransactionClick={onNewTransactionClick}
      />

      {items.length ? (
        <>
          <StyledDivider />
          <List items={items} />
        </>
      ) : null}
      <HelpContainer>
        {!IS_PRODUCTION && safeAddress && (
          <>
            <StyledDivider />
            {devTools}
          </>
        )}
        {!IS_PRODUCTION && debugToggle}
        <StyledDivider />

        <HelpList>
          <StyledListItem id="whats-new-button" button={true}>
            <ListIcon type="addressBook" />
            <StyledListItemText>Whats new</StyledListItemText>
          </StyledListItem>

          <HelpCenterLink href="https://help.gnosis-safe.io/en/" target="_blank" title="Help Center of Gnosis Safe">
            <ListIcon type="question" />
            <StyledListItemText>Help Center</StyledListItemText>
          </HelpCenterLink>
        </HelpList>
      </HelpContainer>
    </>
  )
}

export default Sidebar
