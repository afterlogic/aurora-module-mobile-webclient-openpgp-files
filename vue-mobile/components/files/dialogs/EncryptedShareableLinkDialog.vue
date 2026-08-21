<template>
  <AppDialog :close="cancelDialog">
    <template v-slot:title>
      <div v-if="currentFile && (!currentFile.paranoidKey || currentFile.publicLink)">
        <div v-if="!currentFile.publicLink">
          <span>{{ $t('OPENPGPFILESWEBCLIENT.HEADING_CREATE_PUBLIC_LINK') }}</span>
        </div>
        <div v-if="currentFile.publicLink">
          <span>{{ currentFile.linkPassword ? 'Protected public link' : $t('FILESWEBCLIENT.LABEL_PUBLIC_LINK') }}</span>
        </div>
      </div>
      <div v-else class="q-mb-lg">
        <span>{{ $t('OPENPGPFILESWEBCLIENT.HEADING_SEND_ENCRYPTED_FILE') }}</span>
      </div>
    </template>
    <template v-slot:content>
      <div v-if="currentFile && !showSelectRecipient && (!currentFile.paranoidKey || currentFile.publicLink)">
        <div v-if="!currentFile.publicLink">
          <AppCheckbox
              class="q-pl-lg q-py-lg q-pr-md"
              v-model="withPassword"
              leftLabel
              label="Protect public link with password"
          />
        </div>
        <div v-if="currentFile.publicLink">
          <div class="q-px-lg">
            <div class="q-mb-md q-mt-lg" @click.stop="copyText(currentFile.publicLink, $t('FILESWEBCLIENT.LABEL_PUBLIC_LINK'))">
              <div class="q-mb-sm field__title">Link text</div>
              <div class="flex no-wrap">
                <div class="flex justify-center items-center q-mr-sm">
                  <CopyIcon />
                </div>
                <div class="text__caption flex items-center">
                  <span>{{ currentFile.publicLink }}</span>
                </div>
              </div>
            </div>
            <div
                v-if="currentFile.linkPassword"
                @click.stop="copyText(currentFile.linkPassword, $t('COREWEBCLIENT.LABEL_PASSWORD'))"
            >
              <div class="q-mb-sm field__title">{{ $t('COREWEBCLIENT.LABEL_PASSWORD') }}</div>
              <div class="flex no-wrap">
                <div class="q-mt-xs q-mr-sm">
                  <CopyIcon />
                </div>
                <div class="text__caption flex items-center">
                  <span>{{ currentFile.linkPassword }}</span>
                </div>
              </div>
            </div>
            <div v-if="currentFile.linkPassword" class="q-my-md">
              <span class="inscription">
                {{ $t('OPENPGPFILESWEBCLIENT.HINT_STORE_PASSWORD') }}
              </span>
            </div>
          </div>
          <div v-if="currentFile.linkPassword" class="section-separator" />
          <div class="q-px-lg">
            <div @click="selectRecipient" class="q-mt-lg">
              <div class="q-mb-sm recipient">
                <span>{{ $t('OPENPGPFILESWEBCLIENT.LABEL_RECIPIENT') }}:</span>
              </div>
              <AppContactItem :contact="recipient" />
            </div>
            <div v-if="!recipient.empty" class="q-mt-sm">
              <span class="inscription">{{ sendLinkHintText }}</span>
            </div>
            <div v-if="showSignCheckbox" class="q-mt-md">
              <AppCheckbox
                  v-model="addDigitalSignature"
                  :disable="!isSigningAvailable"
                  leftLabel
                  :label="$t('OPENPGPFILESWEBCLIENT.LABEL_SIGN')"
              />
            </div>
            <div v-if="showSignCheckbox" class="q-mt-sm q-mb-md">
              <span class="inscription">{{ signEmailHintText }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentFile && !showSelectRecipient && currentFile.paranoidKey && !currentFile.publicLink">
        <EncryptedShareableLinkHead :recipient="recipient"  @selectRecipient="selectRecipient" />
      </div>
      <AppSelectRecipient
          v-if="showSelectRecipient"
          :getContactsParameters="getContactsParameters"
          :onGetContacts="getContacts"
          @selectContact="selectContact"
      />
    </template>
    <template v-if="!showSelectRecipient" v-slot:actions>
      <div v-if="currentFile && (!currentFile.paranoidKey || currentFile.publicLink)" class="full-width q-mx-lg q-mb-sm">
        <div v-if="!currentFile.publicLink" class="flex justify-end q-pr-sm">
          <ButtonDialog
              :saving="saving"
              :action="createShareableLink"
              :label="createBtnLabel"
          />
        </div>
        <div v-if="currentFile.publicLink" :class="`full-width flex ${isCreatingLink ? 'justify-end' : 'justify-between'} q-px-sm`">
          <ButtonDialog
              v-if="!isCreatingLink"
              :saving="saving"
              :action="removeLink"
              :label="$t('FILESWEBCLIENT.ACTION_REMOVE_PUBLIC_LINK')"
          />
          <ButtonDialog
              :disabled="recipient.empty || (isCreatingLink && !recipient?.HasPgpPublicKey && currentFile.linkPassword)"
              :saving="saving"
              :action="sendViaMessage"
              :label="isCreatingLink ? sendLabel : $t('OPENPGPFILESWEBCLIENT.ACTION_SEND_EMAIL')"
          />
        </div>
      </div>
      <div v-else>
        <EncryptedShareableLinkActions
            @onProhibitSelectionRecipient="isRecipientDisabled = true"
            @isLinkCreated="isCreatingLink = true" :recipient="recipient"
        />
      </div>
    </template>
  </AppDialog>
</template>

<script>
import AppDialog from "src/components/common/AppDialog";
import ButtonDialog from "src/components/common/ButtonDialog";
import AppContactItem from "src/components/common/AppContactItem";
import CopyIcon from "../../../../../FilesMobileWebclient/vue-mobile/components/icons/CopyIcon";
import AppCheckbox from "src/components/common/AppCheckbox";
import AppSelectRecipient from "src/components/common/AppSelectRecipient";
import notification from "src/utils/notification";

import { defineAsyncComponent } from 'vue'
import { mapGetters, mapActions, mapState } from 'pinia'
import { useFilesStore } from '../../../../../FilesMobileWebclient/vue-mobile/store/index-pinia'
import { useOpenPGPStore } from '../../../../../OpenPgpMobileWebclient/vue-mobile/store/index-pinia'
import { useCoreStore } from '../../../../../CoreMobileWebclient/vue-mobile/src/stores/index-pinia'
import { formatHintText } from '../../../../../FilesMobileWebclient/vue-mobile/utils/common'
import { sendShareableLinkViaEmail } from '../../../utils/send-shareable-link-email'
import { createProtectedPublicLink } from '../../../files/protected-public-link'

const EncryptedShareableLinkActions = defineAsyncComponent(() =>
  import('./encrypted-shareable-link/EncryptedShareableLinkActions')
)
const EncryptedShareableLinkHead = defineAsyncComponent(() =>
  import('./encrypted-shareable-link/EncryptedShareableLinkHead')
)

export default {
  name: "EncryptedShareableLinkDialog",
  components: {
    AppDialog,
    ButtonDialog,
    AppContactItem,
    CopyIcon,
    AppCheckbox,
    AppSelectRecipient,
    EncryptedShareableLinkActions,
    EncryptedShareableLinkHead
  },
  data: () => ({
    withPassword: false,
    openDialog: false,
    saving: false,
    publicLink: '',
    linkPassword: '',
    resultingComponents: null,
    recipient: { FullName: 'Not Selected', empty: true },
    isCreatingLink: false,
    showSelectRecipient: false,
    sendLinkLabel: '',
    isRecipientDisabled: false,
    addDigitalSignature: false,
    getContactsParameters: {
      Search:'',
      Storage:'all',
      SortField:3,
      SortOrder:1,
      WithGroups:false,
      WithoutTeamContactsDuplicates:true
    }
  }),
  computed: {
    ...mapGetters(useFilesStore, ['currentFile']),
    ...mapState(useOpenPGPStore, ['myPrivateKeys']),
    ...mapState(useCoreStore, ['userPublicId']),
    sendLabel() {
      return this.$t('OPENPGPFILESWEBCLIENT.ACTION_SEND_ENCRYPTED_EMAIL')
    },
    createBtnLabel() {
      return this.withPassword
          ? 'Create protected link'
          : 'Create shareable link'
    },
    isSigningAvailable() {
      return !!(this.currentFile?.linkPassword && this.recipientHasPgpKey && this.myPrivateKeys?.length)
    },
    showSignCheckbox() {
      return !!(this.currentFile?.linkPassword && this.recipientHasPgpKey)
    },
    recipientHasPgpKey() {
      return !!(this.recipient?.HasPgpPublicKey || this.recipient?.hasPgpPublicKey || this.recipient?.PublicPgpKey)
    },
    sendLinkHintText() {
      if (this.recipient?.empty) {
        return ''
      }
      if (this.recipientHasPgpKey) {
        if (this.currentFile?.linkPassword) {
          if (this.addDigitalSignature && this.isSigningAvailable) {
            return formatHintText(this.$t('OPENPGPFILESWEBCLIENT.HINT_SEND_LINK_AND_PASSWORD_SIGNED'))
          }
          return formatHintText(this.$t('OPENPGPFILESWEBCLIENT.HINT_SEND_LINK_AND_PASSWORD'))
        }
        return formatHintText(this.$t('OPENPGPFILESWEBCLIENT.HINT_SEND_LINK'))
      }
      if (this.currentFile?.linkPassword) {
        return formatHintText(this.$t('OPENPGPFILESWEBCLIENT.HINT_SEND_DIFFERENT_CHANNEL'))
      }
      return formatHintText(this.$t('OPENPGPFILESWEBCLIENT.HINT_SEND_LINK'))
    },
    signEmailHintText() {
      return formatHintText(this.addDigitalSignature
        ? this.$t('OPENPGPFILESWEBCLIENT.HINT_SIGN_EMAIL')
        : this.$t('OPENPGPFILESWEBCLIENT.HINT_NOT_SIGN_EMAIL'))
    },
  },
  watch: {
    recipient: {
      handler() {
        this.addDigitalSignature = !!(this.recipientHasPgpKey && this.currentFile?.linkPassword && this.myPrivateKeys?.length)
      },
      deep: true,
    },
  },
  mounted() {
    console.log('pgp')
  },
  methods: {
    ...mapActions(useFilesStore, ['getContactSuggestions', 'asyncDeletePublicLink', 'changeItemProperty']),
    cancelDialog() {
      if (this.showSelectRecipient) {
        this.showSelectRecipient = false
      } else {
        this.changeItemProperty({
          item: this.currentFile,
          property: 'linkPassword',
          value: ''
        })
        this.isCreatingLink = false
        this.isRecipientDisabled = false
        this.$emit('closeDialog')
      }
    },
    selectRecipient() {
      if (!this.isRecipientDisabled) {
        this.showSelectRecipient = true
      }
    },
    copyText(text, valueName) {
      navigator.clipboard.writeText(text).then(() => {
        notification.showReport(
            `The ${valueName} has been copied to the clipboard.`
        )
      })
    },
    async createShareableLink() {
      const created = await createProtectedPublicLink(this.currentFile, {
        withPassword: this.withPassword,
      })
      if (created) {
        this.changeItemProperty({
          item: this.currentFile,
          property: 'publicLink',
          value: created.publicLink,
        })
        this.changeItemProperty({
          item: this.currentFile,
          property: 'linkPassword',
          value: created.linkPassword,
        })
        this.publicLink = created.publicLink
        this.linkPassword = created.linkPassword
        this.isCreatingLink = true
        this.addDigitalSignature = false
      }
    },
    async removeLink() {
      this.saving = true
      const result = await this.asyncDeletePublicLink()
      this.saving = false
      if (result) this.$emit('closeDialog')
    },
    async sendViaMessage() {
      if (this.recipient.empty || this.saving) {
        return
      }

      this.saving = true
      try {
        const result = await sendShareableLinkViaEmail({
          file: this.currentFile,
          recipient: this.recipient,
          addDigitalSignature: this.addDigitalSignature,
          userEmail: this.userPublicId,
          router: this.$router,
          getParentComponent: this.$root._getParentComponent,
        })

        if (result) {
          this.$emit('closeDialog')
        }
      } finally {
        this.saving = false
      }
    },
    async getContacts(params) {
      return await this.getContactSuggestions(params)
    },
    selectContact(contact) {
      this.recipient = { ...contact, empty: false }
      this.showSelectRecipient = false
    }
  }
}
</script>

<style scoped>
.field__title {
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.3px;
}
.section-separator {
  border-top: 1px solid #D3D3D3;
}
.recipient {
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.3px;
  color: #4B4A4A;
}
.inscription {
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #B6B5B5;
}
</style>
