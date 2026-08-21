import _ from 'lodash'
import modulesManager from 'src/modules-manager'
import { getApiHost } from 'src/api/helpers'
import webApi from 'src/api/web-api'

/** Backend module that exposes CreatePublicLink with password / PGP options. */
export const OPGP_FILES_MODULE = 'OpenPgpFilesWebclient'

export function isProtectedPublicLinksAvailable() {
  return modulesManager.isModuleAvailable(OPGP_FILES_MODULE)
}

/**
 * Creates a password-protected (or OpenPgp-enhanced) public link via OpenPgpFilesWebclient.
 * @param {Object} file Current file/folder item from Files store
 * @param {{ withPassword?: boolean, password?: string, recipientEmail?: string, pgpEncryptionMode?: string, lifetimeHrs?: number }} [options]
 * @returns {Promise<{ publicLink: string, linkPassword: string }|false>}
 */
export async function createProtectedPublicLink(file, options = {}) {
  if (!file || !isProtectedPublicLinksAvailable()) {
    return false
  }

  let password = options.password || ''
  if (options.withPassword && !password) {
    const OpenPgp = (await import('../../../OpenPgpMobileWebclient/vue-mobile/openpgp-helper')).default
    password = OpenPgp.generatePassword()
  }

  const parameters = {
    Type: file.type,
    Path: file.path,
    Name: file.name,
    Size: file.size,
    IsFolder: file.isFolder,
    RecipientEmail: options.recipientEmail || '',
    PgpEncryptionMode: options.pgpEncryptionMode || '',
    LifetimeHrs: options.lifetimeHrs || 0,
    Password: password,
  }

  const result = await webApi
    .sendRequest({
      moduleName: OPGP_FILES_MODULE,
      methodName: 'CreatePublicLink',
      parameters,
    })
    .catch(() => false)

  if (!result) {
    return false
  }

  const linkPath = _.isString(result?.link) ? result.link : (_.isString(result) ? result : null)
  if (!linkPath) {
    return false
  }

  return {
    publicLink: `${getApiHost()}${linkPath}`,
    linkPassword: result.password || password || '',
  }
}
