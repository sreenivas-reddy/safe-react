import { ReactElement, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Block from 'src/components/layout/Block'
import Col from 'src/components/layout/Col'
import Hairline from 'src/components/layout/Hairline'
import Paragraph from 'src/components/layout/Paragraph'
import Row from 'src/components/layout/Row'
import Modal, { ButtonStatus, Modal as GenericModal } from 'src/components/Modal'
import PrefixedEthHashInfo from 'src/components/PrefixedEthHashInfo'
import { ReviewInfoText } from 'src/components/ReviewInfoText'
import { getExplorerInfo } from 'src/config'
import { createTransaction } from 'src/logic/safe/store/actions/createTransaction'
import { currentSafe } from 'src/logic/safe/store/selectors'
import { TX_NOTIFICATION_TYPES } from 'src/logic/safe/transactions'
import { useStyles } from './style'
import { Errors, logError } from 'src/logic/exceptions/CodedException'
import { EstimationStatus, useEstimateTransactionGas } from 'src/logic/hooks/useEstimateTransactionGas'
import { useEstimationStatus } from 'src/logic/hooks/useEstimationStatus'
import { TxParametersDetail } from 'src/routes/safe/components/Transactions/helpers/TxParametersDetail'
import { EditableTxParameters } from 'src/routes/safe/components/Transactions/helpers/EditableTxParameters'
import { TxParameters } from 'src/routes/safe/container/hooks/useTransactionParameters'
import { ModalHeader } from 'src/routes/safe/components/Balances/SendModal/screens/ModalHeader'
import { userAccountSelector } from 'src/logic/wallets/store/selectors'
import { getDisableModuleTxData } from 'src/logic/safe/utils/modules'
import useCanTxExecute from 'src/logic/hooks/useCanTxExecute'

interface RemoveModuleModalProps {
  onClose: () => void
  selectedModuleAddress: string
}

export const RemoveModuleModal = ({ onClose, selectedModuleAddress }: RemoveModuleModalProps): ReactElement => {
  const classes = useStyles()

  const { address: safeAddress, currentVersion: safeVersion } = useSelector(currentSafe)
  const [txData, setTxData] = useState('')
  const dispatch = useDispatch()
  const connectedWalletAddress = useSelector(userAccountSelector)
  const [manualSafeTxGas, setManualSafeTxGas] = useState('0')
  const [manualGasPrice, setManualGasPrice] = useState<string | undefined>()
  const [manualGasLimit, setManualGasLimit] = useState<string | undefined>()
  const [manualSafeNonce, setManualSafeNonce] = useState<number | undefined>()

  const { txEstimationExecutionStatus, isOffChainSignature, isCreation, gasLimit, gasEstimation, gasPriceFormatted } =
    useEstimateTransactionGas({
      txData,
      txRecipient: safeAddress,
      txAmount: '0',
      safeTxGas: manualSafeTxGas,
      manualGasPrice,
      manualGasLimit,
      manualSafeNonce,
    })
  const canTxExecute = useCanTxExecute(false, manualSafeNonce)
  const [buttonStatus] = useEstimationStatus(txEstimationExecutionStatus)

  useEffect(() => {
    let isCurrent = true

    const calculateRemoveOwnerData = async () => {
      try {
        const txData = await getDisableModuleTxData({
          moduleAddress: selectedModuleAddress,
          safeAddress,
          safeVersion,
          connectedWalletAddress,
        })

        if (isCurrent) {
          setTxData(txData)
        }
      } catch (error) {
        logError(Errors._806, `${selectedModuleAddress} - ${error.message}`)
      }
    }
    calculateRemoveOwnerData()

    return () => {
      isCurrent = false
    }
  }, [connectedWalletAddress, safeAddress, safeVersion, selectedModuleAddress])

  const removeSelectedModule = async (txParameters: TxParameters): Promise<void> => {
    try {
      dispatch(
        createTransaction({
          safeAddress,
          to: safeAddress,
          valueInWei: '0',
          txData,
          txNonce: txParameters.safeNonce,
          safeTxGas: txParameters.safeTxGas,
          ethParameters: txParameters,
          notifiedTransaction: TX_NOTIFICATION_TYPES.SETTINGS_CHANGE_TX,
        }),
      )
    } catch (e) {
      logError(Errors._806, `${selectedModuleAddress} - ${e.message}`)
    }
  }

  const closeEditModalCallback = (txParameters: TxParameters) => {
    const oldGasPrice = gasPriceFormatted
    const newGasPrice = txParameters.ethGasPrice
    const oldSafeTxGas = gasEstimation
    const newSafeTxGas = txParameters.safeTxGas
    const newSafeNonce = txParameters.safeNonce

    if (newGasPrice && oldGasPrice !== newGasPrice) {
      setManualGasPrice(txParameters.ethGasPrice)
    }

    if (txParameters.ethGasLimit && gasLimit !== txParameters.ethGasLimit) {
      setManualGasLimit(txParameters.ethGasLimit)
    }

    if (newSafeTxGas && oldSafeTxGas !== newSafeTxGas) {
      setManualSafeTxGas(newSafeTxGas)
    }

    if (newSafeNonce) {
      const newSafeNonceNumber = parseInt(newSafeNonce, 10)
      setManualSafeNonce(newSafeNonceNumber)
    }
  }

  let confirmButtonText = 'Remove'
  if (ButtonStatus.LOADING === buttonStatus) {
    confirmButtonText = txEstimationExecutionStatus === EstimationStatus.LOADING ? 'Estimating' : 'Removing'
  }

  return (
    <Modal
      description="Remove the selected Module"
      handleClose={onClose}
      paperClassName="modal"
      title="Remove Module"
      open
    >
      <EditableTxParameters
        isOffChainSignature={isOffChainSignature}
        isExecution={canTxExecute}
        ethGasLimit={gasLimit}
        ethGasPrice={gasPriceFormatted}
        safeTxGas={gasEstimation}
        closeEditModalCallback={closeEditModalCallback}
      >
        {(txParameters, toggleEditMode) => {
          return (
            <>
              <ModalHeader onClose={onClose} title="Remove Module" />
              <Hairline />
              <Block>
                <Row className={classes.modalOwner}>
                  <Col align="center" xs={1}>
                    <PrefixedEthHashInfo
                      hash={selectedModuleAddress}
                      showCopyBtn
                      showAvatar
                      explorerUrl={getExplorerInfo(selectedModuleAddress)}
                    />
                  </Col>
                </Row>
                <Row className={classes.modalDescription}>
                  <Paragraph noMargin size="lg">
                    After removing this module, any feature or app that uses this module might no longer work. If this
                    Safe requires more then one signature, the module removal will have to be confirmed by other owners
                    as well.
                  </Paragraph>
                </Row>
              </Block>
              <Block className={classes.accordionContainer}>
                {/* Tx Parameters */}
                <TxParametersDetail
                  txParameters={txParameters}
                  onEdit={toggleEditMode}
                  isTransactionCreation={isCreation}
                  isTransactionExecution={canTxExecute}
                  isOffChainSignature={isOffChainSignature}
                />
              </Block>
              <Row className={classes.modalDescription}>
                <ReviewInfoText
                  isCreation={isCreation}
                  isExecution={canTxExecute}
                  safeNonce={txParameters.safeNonce}
                  txEstimationExecutionStatus={txEstimationExecutionStatus}
                />
              </Row>
              <GenericModal.Footer withoutBorder={buttonStatus !== ButtonStatus.LOADING}>
                <GenericModal.Footer.Buttons
                  cancelButtonProps={{ onClick: onClose }}
                  confirmButtonProps={{
                    color: 'error',
                    onClick: () => removeSelectedModule(txParameters),
                    status: buttonStatus,
                    text: confirmButtonText,
                  }}
                />
              </GenericModal.Footer>
            </>
          )
        }}
      </EditableTxParameters>
    </Modal>
  )
}
