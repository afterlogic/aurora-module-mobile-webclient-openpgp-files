import { i18n } from 'src/boot/i18n'
import addressUtils from 'src/utils/address'
import notification from 'src/utils/notification'

import { composeMessageWithData, isComposeAvailable } from '../../../MailMobileWebclient/vue-mobile/utils/compose'
import openpgpWebApi from '../../../OpenPgpMobileWebclient/vue-mobile/openpgp-web-api'
import OpenPgpKey from '../../../OpenPgpMobileWebclient/vue-mobile/classes/open-pgp-key'
import { askOpenPgpKeyPassword } from '../../../OpenPgpMobileWebclient/vue-mobile/utils'

const { t } = i18n.global

const translatePlainBody = (key, params = {}) => {
  return t(`OPENPGPFILESWEBCLIENT.${key}`, params).replace(/%BR%/g, '\r\n')
}

const recipientHasPgpKey = (recipient) => {
  return !!(recipient?.HasPgpPublicKey || recipient?.hasPgpPublicKey || recipient?.PublicPgpKey)
}

const getRecipientAddress = (recipient) => {
  const email = recipient?.ViewEmail || recipient?.email || ''
  if (!email) {
    return ''
  }

  return addressUtils.getFullEmail(recipient?.FullName || recipient?.fullName || '', email)
}

const getPublicKeysForRecipient = async (OpenPgp, recipient) => {
  const publicKeys = []
  const contactEmail = recipient?.ViewEmail || recipient?.email || ''

  if (recipient?.UUID) {
    const keysFromApi = await openpgpWebApi.getPublicKeysByContactUUIDs([recipient.UUID])
    keysFromApi.forEach((item) => {
      if (item.PublicPgpKey) {
        publicKeys.push(new OpenPgpKey({
          armor: item.PublicPgpKey,
          email: contactEmail,
          isPublic: true,
        }))
      }
    })
  }

  if (!publicKeys.length && contactEmail) {
    const key = OpenPgp.getPublicKeyByEmail(contactEmail)
    if (key) {
      publicKeys.push(key)
    }
  }

  return publicKeys
}

const encryptMessageBody = async ({
  body,
  recipient,
  sign,
  userEmail,
  getParentComponent,
}) => {
  const OpenPgp = (await import('../../../OpenPgpMobileWebclient/vue-mobile/openpgp-helper')).default
  const publicKeys = await getPublicKeysForRecipient(OpenPgp, recipient)

  if (!publicKeys.length) {
    return { error: t('OPENPGPWEBCLIENT.ERROR_TO_ENCRYPT_SPECIFY_RECIPIENTS') }
  }

  if (sign) {
    const privateKey = OpenPgp.getPrivateKeyByEmail(userEmail)
    if (!privateKey) {
      return { error: t('OPENPGPFILESWEBCLIENT.HINT_NOT_SIGN_FILE_REQUIRES_PRIVATE_KEY') }
    }

    const result = await OpenPgp.signAndEncryptText(
      body,
      publicKeys,
      privateKey,
      (email, callback) => askOpenPgpKeyPassword(email, getParentComponent, callback)
    )

    if (result?.sEncryptedSignedData) {
      return { result: result.sEncryptedSignedData }
    }

    if (!result?.sError) {
      return { canceled: true }
    }

    return { error: result.sError || t('OPENPGPWEBCLIENT.ERROR_ENCRYPT_OR_SIGN') }
  }

  const result = await OpenPgp.encryptText(body, publicKeys)
  if (result?.sEncryptedData) {
    return { result: result.sEncryptedData }
  }

  return { error: result?.sError || t('OPENPGPWEBCLIENT.ERROR_ENCRYPT') }
}

export async function sendShareableLinkViaEmail({
  file,
  recipient,
  addDigitalSignature = false,
  userEmail,
  router,
  getParentComponent,
}) {
  if (!recipient || recipient.empty) {
    return false
  }

  if (!isComposeAvailable()) {
    notification.showError(t('OPENPGPFILESWEBCLIENT.HINT_SEND_LINK'))
    return false
  }

  const to = getRecipientAddress(recipient)
  if (!to) {
    return false
  }

  const subject = t('OPENPGPFILESWEBCLIENT.PUBLIC_LINK_MESSAGE_SUBJECT', {
    FILENAME: file?.name || file?.fileName || '',
  })

  const publicLink = file?.publicLink || ''
  const linkPassword = file?.linkPassword || ''
  const isEncryptedEmail = recipientHasPgpKey(recipient) && !!linkPassword

  let body = ''
  let isHtml = true

  if (isEncryptedEmail) {
    body = translatePlainBody('ENCRYPTED_LINK_MESSAGE_BODY_WITH_PASSWORD', {
      URL: publicLink,
      PASSWORD: linkPassword,
    })
    isHtml = false

    const encryptResult = await encryptMessageBody({
      body,
      recipient,
      sign: addDigitalSignature,
      userEmail,
      getParentComponent,
    })

    if (encryptResult.error) {
      notification.showError(encryptResult.error)
      return false
    }

    if (encryptResult.canceled) {
      return false
    }

    body = encryptResult.result
  } else {
    body = t('OPENPGPFILESWEBCLIENT.LINK_MESSAGE_BODY', { URL: publicLink })
    isHtml = true
  }

  const isComposed = composeMessageWithData({
    to,
    subject,
    body,
    isHtml,
  }, router)

  return isComposed
}

export default {
  sendShareableLinkViaEmail,
}
