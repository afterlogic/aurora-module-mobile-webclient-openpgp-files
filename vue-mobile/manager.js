import eventBus from 'src/event-bus'
import { defineAsyncComponent, shallowRef } from 'vue'
import { setFileActions } from "./files/file-operations";

const _getEncryptedShareableLinkDialog = (callBack) => {
    callBack({
        head: shallowRef(defineAsyncComponent(() => import('./components/files/dialogs/encrypted-shareable-link/EncryptedShareableLinkHead'))),
        actions: shallowRef(defineAsyncComponent(() => import('./components/files/dialogs/encrypted-shareable-link/EncryptedShareableLinkActions')))
    })
}

export default {
    moduleName: 'OpenPgpFilesMobileWebclient',

    requiredModules: [],

    init (appdata) {
        eventBus.$off('FilesMobileWebClient::getFileActionsList', setFileActions)
        eventBus.$on('FilesMobileWebClient::getFileActionsList', setFileActions)

    },
    initSubscriptions(appData) {
        eventBus.$off('FilesMobile::GetEncryptedShareableLinkDialog', _getEncryptedShareableLinkDialog)
        eventBus.$on('FilesMobile::GetEncryptedShareableLinkDialog', _getEncryptedShareableLinkDialog)
    }
}
