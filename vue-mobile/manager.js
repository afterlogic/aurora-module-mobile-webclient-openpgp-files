import eventBus from 'src/event-bus'
import { setFileActions } from './files/file-operations'

export default {
    moduleName: 'OpenPgpFilesMobileWebclient',

    requiredModules: [],

    init (appdata) {
        eventBus.$off('FilesMobileWebClient::getFileActionsList', setFileActions)
        eventBus.$on('FilesMobileWebClient::getFileActionsList', setFileActions)
    },
}
