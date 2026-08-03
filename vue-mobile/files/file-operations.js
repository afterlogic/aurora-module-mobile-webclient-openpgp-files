import { defineAsyncComponent } from 'vue'

function loadShareableLinkDialog() {
  return import('../../../FilesMobileWebclient/vue-mobile/store/index-pinia').then(({ useFilesStore }) => {
    const file = useFilesStore().currentFile
    if (file?.paranoidKey && !file?.publicLink) {
      return import('../components/files/dialogs/EncryptedShareableLinkDialog')
    }
    return import('../../../FilesMobileWebclient/vue-mobile/components/dialogs/CreateShareableLinkDialog')
  }).then((module) => module.default)
}

export const setFileActions = (actions) => {
    const isShowAction = actions.createShareableLink?.isShowAction
    actions.createShareableLink = {
        method: null,
        name: 'createShareableLink',
        getComponent: () => defineAsyncComponent(() => loadShareableLinkDialog()),
        displayNameKey: 'OPENPGPFILESWEBCLIENT.ACTION_SECURE_SHARE',
        icon: 'SecureLinkIcon',
        isShowAction,
    }
}
