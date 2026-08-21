import { defineAsyncComponent } from 'vue'
import modulesManager from 'src/modules-manager'

const OPGP_FILES_MODULE = 'OpenPgpFilesWebclient'

/**
 * Adds a separate secure public-link action (desktop parity).
 * Does not replace Files' simple createShareableLink.
 */
export const setFileActions = (actions) => {
  if (!modulesManager.isModuleAvailable(OPGP_FILES_MODULE)) {
    return
  }

  const isShowAction = actions.createShareableLink?.isShowAction
  actions.createSecureShareableLink = {
    method: null,
    name: 'createSecureShareableLink',
    getComponent: () => defineAsyncComponent(() =>
      import('../components/files/dialogs/EncryptedShareableLinkDialog')
    ),
    displayNameKey: 'OPENPGPFILESWEBCLIENT.ACTION_SECURE_SHARE',
    icon: 'SecureLinkIcon',
    isShowAction: (name, items, storage, path) => {
      return typeof isShowAction === 'function'
        ? isShowAction(name, items, storage, path)
        : true
    },
  }
}
