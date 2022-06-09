import eventBus from 'src/event-bus'
import { defineAsyncComponent, shallowRef } from 'vue'


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
        console.log('OpenPgpFilesMobileWebclient')
        const fileOperations = require('../../CoreParanoidEncryptionWebclientPlugin/vue-mobile/files/file-operations')
        console.log('open pgp setFileActions')
        eventBus.$off('FilesMobileWebClient::getFileActionsList', fileOperations.setFileActions)
        eventBus.$on('FilesMobileWebClient::getFileActionsList', fileOperations.setFileActions)

    },
    initSubscriptions(appData) {
        console.log(appData, 'appData pgp')
        eventBus.$off('FilesMobile::GetEncryptedShareableLinkDialog', _getEncryptedShareableLinkDialog)
        eventBus.$on('FilesMobile::GetEncryptedShareableLinkDialog', _getEncryptedShareableLinkDialog)
    }
}
