<template>
  <q-page class="flex flex-center">
    <div class="auth-container">
      <div class="text-center q-mb-lg">
        <h4 class="q-my-none">{{ $t('app.title') }}</h4>
        <p class="text-subtitle1">{{ $t('auth.login') }}</p>
      </div>

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
          v-model="email"
          :label="$t('auth.email')"
          type="email"
          outlined
          :rules="[
            (val) => !!val || $t('auth.emailRequired'),
            (val) => emailPattern.test(val) || $t('auth.emailInvalid')
          ]"
        />

        <q-input
          v-model="password"
          :label="$t('auth.password')"
          type="password"
          outlined
          :rules="[(val) => !!val || $t('auth.passwordRequired')]"
        />

        <div class="full-width q-mt-md">
          <q-btn
            type="submit"
            color="primary"
            class="full-width"
            :label="$t('auth.login')"
            :loading="loading"
          />
        </div>

        <div class="text-center q-mt-sm">
          <p>
            {{ $t('auth.noAccount') }}
            <router-link to="/auth/register">{{ $t('auth.register') }}</router-link>
          </p>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const router = useRouter()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const loading = ref(false)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const onSubmit = async () => {
  try {
    loading.value = true
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    })

    // 토큰과 사용자 정보 저장
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))

    $q.notify({
      color: 'positive',
      message: t('auth.loginSuccess'),
      icon: 'check_circle'
    })

    // 메인 페이지로 이동
    router.push('/')
  } catch (error) {
    let errorMessage = t('app.error')

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = t('auth.invalidCredentials')
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      }
    }

    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}
</style>
