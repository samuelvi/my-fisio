/**
 * Reusable Form Draft UI Component
 *
 * Renders draft alert and modals for any form
 */

import React from 'react';
import DraftAlert from './DraftAlert';
import DraftModal from './DraftModal';

interface FormDraftUIProps {
  hasDraft: boolean;
  draftAge: string | null;
  draftSavedByError: boolean;
  showRestoreModal: boolean;
  showDiscardModal: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  onRestoreConfirm: () => void;
  onDiscardConfirm: () => void;
  onRestoreCancel: () => void;
  onDiscardCancel: () => void;
}

/**
 * All-in-one draft UI component
 *
 * Renders:
 * - Draft alert (when savedByError is true)
 * - Restore confirmation modal
 * - Discard confirmation modal
 */
export default function FormDraftUI({
  hasDraft,
  draftAge,
  draftSavedByError,
  showRestoreModal,
  showDiscardModal,
  onRestore,
  onDiscard,
  onRestoreConfirm,
  onDiscardConfirm,
  onRestoreCancel,
  onDiscardCancel
}: FormDraftUIProps) {
  return (
    <>
      {/* Draft Alert */}
      <DraftAlert
        show={hasDraft && draftSavedByError}
        draftAge={draftAge}
        onRestore={onRestore}
        onDiscard={onDiscard}
        variant="error"
      />

      {/* Restore Modal */}
      <DraftModal
        isOpen={showRestoreModal}
        onCancel={onRestoreCancel}
        onConfirm={onRestoreConfirm}
        title="Recuperar borrador"
        message="¿Estás seguro de que quieres recuperar el borrador guardado? Se sobrescribirán los datos actuales del formulario."
        type="restore"
      />

      {/* Discard Modal */}
      <DraftModal
        isOpen={showDiscardModal}
        onCancel={onDiscardCancel}
        onConfirm={onDiscardConfirm}
        title="Descartar borrador"
        message="¿Estás seguro de que quieres descartar este borrador? Esta acción no se puede deshacer."
        type="discard"
      />
    </>
  );
}
