<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md items-center">
      <div class="col">
        <h5 class="q-my-none">{{ $t('transcript.list') }}</h5>
      </div>
      <div>
        <q-btn
          color="primary"
          :label="$t('transcript.upload')"
          icon="upload_file"
          @click="showUploadDialog"
        />
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="row justify-center q-py-lg">
      <q-spinner color="primary" size="3em" />
      <div class="text-subtitle1 q-ml-md">{{ $t('app.loading') }}</div>
    </div>

    <!-- 트랜스크립트가 없는 경우 -->
    <div v-else-if="transcripts.length === 0" class="row justify-center q-py-xl">
      <div class="text-center">
        <q-icon name="description" size="4rem" color="grey-5" />
        <p class="text-subtitle1">{{ $t('transcript.empty') }}</p>
        <q-btn
          color="primary"
          :label="$t('transcript.upload')"
          icon="upload_file"
          @click="showUploadDialog"
        />
      </div>
    </div>

    <!-- 트랜스크립트 목록 -->
    <div v-else>
      <q-list bordered separator>
        <q-item
          v-for="transcript in transcripts"
          :key="transcript.id"
          clickable
          @click="openTranscript(transcript)"
        >
          <q-item-section avatar>
            <q-icon
              :name="getStatusIcon(transcript.status)"
              :color="getStatusColor(transcript.status)"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ transcript.originalFilename }}</q-item-label>
            <q-item-label caption>
              {{ formatDate(transcript.createdAt) }} ·
              {{ formatFileSize(transcript.fileSize) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-badge :color="getStatusColor(transcript.status)">
              {{ $t(`transcript.${transcript.status}`) }}
            </q-badge>
          </q-item-section>

          <q-item-section side>
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              @click.stop
            >
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item clickable @click.stop="openTranscript(transcript)">
                    <q-item-section avatar>
                      <q-icon name="visibility" />
                    </q-item-section>
                    <q-item-section>{{ $t('app.view') }}</q-item-section>
                  </q-item>

                  <q-item
                    v-if="transcript.status === 'completed'"
                    clickable
                    @click.stop="downloadTranscript(transcript)"
                  >
                    <q-item-section avatar>
                      <q-icon name="download" />
                    </q-item-section>
                    <q-item-section>{{ $t('app.download') }}</q-item-section>
                  </q-item>

                  <q-item
                    v-if="transcript.status === 'completed'"
                    clickable
                    @click.stop="editTranscript(transcript)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" />
                    </q-item-section>
                    <q-item-section>{{ $t('app.edit') }}</q-item-section>
                  </q-item>

                  <q-separator />

                  <q-item clickable @click.stop="confirmDelete(transcript)">
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>
                    <q-item-section>{{ $t('app.delete') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- 파일 업로드 다이얼로그 -->
    <q-dialog v-model="uploadDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t('transcript.upload') }}</div>
        </q-card-section>

        <q-card-section>
          <q-uploader
            ref="uploader"
            :label="$t('transcript.uploadHint')"
            :url="`${apiBaseUrl}/transcripts/upload`"
            accept=".m4a,.mp3,.wav,.ogg,.flac"
            :headers="uploadHeaders"
            field-name="audio"
            @uploaded="onUploaded"
            @failed="onUploadFailed"
          >
            <template v-slot:header="scope">
              <div class="row no-wrap items-center q-pa-sm q-gutter-xs">
                <q-btn
                  v-if="scope.queuedFiles.length > 0"
                  icon="clear_all"
                  round
                  dense
                  flat
                  @click="scope.removeQueuedFiles"
                />
                <q-spinner
                  v-if="scope.isUploading"
                  class="q-uploader__spinner"
                />
                <div class="col">
                  <div class="q-uploader__title">{{ $t('transcript.upload') }}</div>
                  <div class="q-uploader__subtitle">
                    {{ $t('transcript.supportedFormats') }}
                  </div>
                </div>
                <q-btn
                  v-if="scope.canAddFiles"
                  icon="add_box"
                  round
                  dense
                  flat
                  @click.stop.prevent="scope.pickFiles"
                />
              </div>
            </template>
          </q-uploader>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('app.cancel')" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 트랜스크립트 상세 다이얼로그 -->
    <q-dialog v-model="detailDialog" full-width>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ selectedTranscript?.originalFilename }}</div>
          <div class="text-subtitle2">
            {{ formatDate(selectedTranscript?.createdAt) }} ·
            {{ formatFileSize(selectedTranscript?.fileSize) }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-badge :color="getStatusColor(selectedTranscript?.status)">
            {{ $t(`transcript.${selectedTranscript?.status}`) }}
          </q-badge>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 50vh" class="scroll">
          <div v-if="selectedTranscript?.status === 'completed'">
            <div v-if="!isEditing">
              <div class="text-body1 whitespace-pre-wrap">{{ selectedTranscript?.text }}</div>
            </div>
            <div v-else>
              <q-input
                v-model="editedText"
                type="textarea"
                autogrow
                outlined
                :label="$t('transcript.edit')"
                :rows="10"
              />
            </div>
          </div>
          <div v-else-if="selectedTranscript?.status === 'processing'">
            <div class="row justify-center q-py-md">
              <q-spinner color="primary" size="2em" />
              <div class="text-subtitle1 q-ml-md">{{ $t('transcript.processing') }}</div>
            </div>
          </div>
          <div v-else-if="selectedTranscript?.status === 'failed'">
            <div class="text-negative">
              {{ selectedTranscript?.error || $t('app.error') }}
            </div>
          </div>
          <div v-else>
            <div class="text-grey-7">{{ $t('transcript.noText') }}</div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <template v-if="selectedTranscript?.status === 'completed'">
            <template v-if="isEditing">
              <q-btn flat :label="$t('app.cancel')" color="primary" @click="cancelEdit" />
              <q-btn :label="$t('app.save')" color="primary" @click="saveEdit" />
            </template>
            <template v-else>
              <q-btn flat :label="$t('app.edit')" color="primary" @click="startEdit" />
              <q-btn flat :label="$t('app.download')" color="primary" @click="downloadTranscript(selectedTranscript)" />
            </template>
          </template>
          <q-btn flat :label="$t('app.close')" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 삭제 확인 다이얼로그 -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">{{ $t('transcript.deleteConfirm') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('app.cancel')" color="primary" v-close-popup />
          <q-btn :label="$t('app.delete')" color="negative" @click="deleteTranscript" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { api } from 'src/boot/axios'
import { date } from 'quasar'

const $q = useQuasar()
const { t } = useI18n()

// 상태 변수
const loading = ref(true)
const transcripts = ref([])
const uploadDialog = ref(false)
const detailDialog = ref(false)
const deleteDialog = ref(false)
const selectedTranscript = ref(null)
const transcriptToDelete = ref(null)
const isEditing = ref(false)
const editedText = ref('')
const apiBaseUrl = 'https://server.ljlee37.com:5759/api'

// 업로드 헤더 설정 (인증 토큰 포함)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? [{ name: 'Authorization', value: `Bearer ${token}` }] : []
})

// 컴포넌트 마운트 시 트랜스크립트 목록 로드
onMounted(() => {
  loadTranscripts()
})

// 트랜스크립트 목록 로드
async function loadTranscripts() {
  try {
    loading.value = true
    const response = await api.get('/transcripts')
    transcripts.value = response.data.transcripts
  } catch (error) {
    console.error('Failed to load transcripts:', error)
    $q.notify({
      color: 'negative',
      message: t('app.error'),
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 업로드 다이얼로그 표시
function showUploadDialog() {
  uploadDialog.value = true
}

// 업로드 성공 처리
function onUploaded() {
  $q.notify({
    color: 'positive',
    message: t('transcript.uploadSuccess'),
    icon: 'cloud_done'
  })
  uploadDialog.value = false
  loadTranscripts()
}

// 업로드 실패 처리
function onUploadFailed(info) {
  let errorMessage = t('transcript.uploadError')

  if (info.xhr && info.xhr.response) {
    try {
      const response = JSON.parse(info.xhr.response)
      if (response.message) {
        errorMessage = response.message
      }
    } catch (e) {
      console.error('Failed to parse error response:', e)
    }
  }

  $q.notify({
    color: 'negative',
    message: errorMessage,
    icon: 'error'
  })
}

// 트랜스크립트 상세 보기
function openTranscript(transcript) {
  selectedTranscript.value = transcript
  isEditing.value = false
  detailDialog.value = true
}

// 트랜스크립트 편집 시작
function startEdit() {
  editedText.value = selectedTranscript.value.text
  isEditing.value = true
}

// 트랜스크립트 편집 취소
function cancelEdit() {
  isEditing.value = false
}

// 트랜스크립트 편집 저장
async function saveEdit() {
  try {
    const response = await api.put(`/transcripts/${selectedTranscript.value.id}/text`, {
      text: editedText.value
    })

    selectedTranscript.value = response.data.transcript
    isEditing.value = false

    // 목록 업데이트
    const index = transcripts.value.findIndex(t => t.id === selectedTranscript.value.id)
    if (index !== -1) {
      transcripts.value[index] = selectedTranscript.value
    }

    $q.notify({
      color: 'positive',
      message: t('transcript.editSuccess'),
      icon: 'check_circle'
    })
  } catch (error) {
    console.error('Failed to update transcript:', error)
    $q.notify({
      color: 'negative',
      message: t('transcript.editError'),
      icon: 'error'
    })
  }
}

// 트랜스크립트 다운로드
function downloadTranscript(transcript) {
  window.open(`${apiBaseUrl}/transcripts/${transcript.id}/download`, '_blank')
}

// 트랜스크립트 삭제 확인
function confirmDelete(transcript) {
  transcriptToDelete.value = transcript
  deleteDialog.value = true
}

// 트랜스크립트 삭제
async function deleteTranscript() {
  try {
    await api.delete(`/transcripts/${transcriptToDelete.value.id}`)

    // 목록에서 제거
    transcripts.value = transcripts.value.filter(t => t.id !== transcriptToDelete.value.id)

    // 상세 다이얼로그가 열려있고 삭제한 트랜스크립트와 같은 경우 닫기
    if (detailDialog.value && selectedTranscript.value?.id === transcriptToDelete.value.id) {
      detailDialog.value = false
    }

    deleteDialog.value = false

    $q.notify({
      color: 'positive',
      message: t('transcript.deleteSuccess'),
      icon: 'check_circle'
    })
  } catch (error) {
    console.error('Failed to delete transcript:', error)
    $q.notify({
      color: 'negative',
      message: t('transcript.deleteError'),
      icon: 'error'
    })
  }
}

// 상태에 따른 아이콘 반환
function getStatusIcon(status) {
  switch (status) {
    case 'completed':
      return 'check_circle'
    case 'processing':
      return 'hourglass_empty'
    case 'failed':
      return 'error'
    default:
      return 'pending'
  }
}

// 상태에 따른 색상 반환
function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'positive'
    case 'processing':
      return 'info'
    case 'failed':
      return 'negative'
    default:
      return 'grey'
  }
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return ''
  return date.formatDate(dateString, 'YYYY-MM-DD HH:mm')
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (!bytes) return ''

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
</script>
