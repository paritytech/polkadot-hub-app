import { FButton, Modal, P } from '../ui'

type ModalProps = {
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

export const WarningModal: React.FC<ModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <Modal onClose={onCancel} title="Important information">
      <div className="flex flex-col gap-4">
        <div>
          <P className="font-bold mb-0">Please be patient</P>
          <p className="mt-0 text-text-secondary">
            Signature/sign requests to your wallet might take a while to
            propagate (2-5 seconds).
          </p>
        </div>

        <div className="block sm:hidden">
          <P className="font-bold mb-0">No redirect back from wallet</P>
          <p className="text-text-secondary">
            After your sign the request in you wallet, you will need to manually
            return back to the browser to continue.
          </p>
        </div>
        <FButton onClick={onConfirm} className="w-full rounded-sm">
          Noted
        </FButton>
      </div>
    </Modal>
  )
}
