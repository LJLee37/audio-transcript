<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          {{ $t('app.title') }}
        </q-toolbar-title>

        <!-- 로그인 상태에 따라 다른 버튼 표시 -->
        <div v-if="isLoggedIn">
          <q-btn flat no-caps :label="userName" class="q-mr-sm">
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable @click="goToProfile">
                  <q-item-section>{{ $t('app.profile') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable @click="logout">
                  <q-item-section>{{ $t('app.logout') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <div v-else>
          <q-btn flat no-caps :label="$t('auth.login')" to="/login" class="q-mr-sm" />
          <q-btn outline no-caps :label="$t('auth.register')" to="/register" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          {{ $t('app.title') }}
        </q-item-label>

        <!-- 로그인한 경우에만 표시할 메뉴 -->
        <template v-if="isLoggedIn">
          <q-item clickable to="/">
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('transcript.list') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable @click="showUploadDialog">
            <q-item-section avatar>
              <q-icon name="upload_file" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('transcript.upload') }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <!-- 로그인하지 않은 경우에 표시할 메뉴 -->
        <template v-else>
          <q-item clickable to="/login">
            <q-item-section avatar>
              <q-icon name="login" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('auth.login') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable to="/register">
            <q-item-section avatar>
              <q-icon name="person_add" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('auth.register') }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

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
                  type="a"
                  icon="add_box"
                  round
                  dense
                  flat
                  @click="scope.pickFiles"
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
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const $q = useQuasar()
const router = useRouter()
const { t } = useI18n()

const leftDrawerOpen = ref(false)
const uploadDialog = ref(false)
const user = ref(null)
const apiBaseUrl = 'https://server.ljlee37.com:5759/api'

// 로그인 상태 확인
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

// 사용자 이름 표시
const userName = computed(() => {
  if (user.value) {
    return user.value.nickname || user.value.name
  }
  return ''
})

// 업로드 헤더 설정 (인증 토큰 포함)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? [{ name: 'Authorization', value: `Bearer ${token}` }] : []
})

// 컴포넌트 마운트 시 사용자 정보 로드
onMounted(() => {
  loadUserInfo()
})

// 사용자 정보 로드
function loadUserInfo() {
  const userJson = localStorage.getItem('user')
  if (userJson) {
    try {
      user.value = JSON.parse(userJson)
    } catch (e) {
      console.error('Failed to parse user info:', e)
    }
  }
}

// 왼쪽 드로어 토글
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
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

  // 메인 페이지로 이동 (트랜스크립트 목록 새로고침)
  router.push('/')
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

// 프로필 페이지로 이동
function goToProfile() {
  router.push('/profile')
}

// 로그아웃
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  $q.notify({
    color: 'info',
    message: t('auth.loginRequired'),
    icon: 'logout'
  })

  router.push('/login')
}
</script>
