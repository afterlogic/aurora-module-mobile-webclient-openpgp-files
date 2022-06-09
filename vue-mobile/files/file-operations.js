import {i18n} from "../../../CoreMobileWebclient/vue-mobile/src/boot/i18n";
import { defineAsyncComponent } from "vue";

export const setFileActions = (actions) => {
    console.log(i18n, 'i18n')
    actions['createShareableLink'] = {
        method: null,
        name: 'createShareableLink',
        component: defineAsyncComponent(() => import('../../../OpenPgpFilesMobileWebclient/vue-mobile/components/files/dialogs/EncryptedShareableLinkDialog')),
        displayName: i18n.global.t('OPENPGPFILESWEBCLIENT.ACTION_SECURE_SHARE'),
        icon: 'SecureLinkIcon',
        isShowAction: actions.createShareableLink.isShowAction,
    }
}
