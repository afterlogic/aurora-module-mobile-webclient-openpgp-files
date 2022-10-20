import { i18n } from 'src/boot/i18n'
import { defineAsyncComponent } from 'vue'

export const setFileActions = (actions) => {
    //TODO this shouldn't override the existing button, but adds new one.
    //The original button must be controlled by settings
    actions['createShareableLink'] = {
        method: null,
        name: 'createShareableLink',
        // component: defineAsyncComponent(() => import('../../../OpenPgpFilesMobileWebclient/vue-mobile/components/files/dialogs/EncryptedShareableLinkDialog')),
        getComponent: () => { return defineAsyncComponent(() => import('../components/files/dialogs/EncryptedShareableLinkDialog')) },
        displayName: i18n.global.t('OPENPGPFILESWEBCLIENT.ACTION_SECURE_SHARE'),
        icon: 'SecureLinkIcon',
        isShowAction: actions.createShareableLink.isShowAction,
    }
}
