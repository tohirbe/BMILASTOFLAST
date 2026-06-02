// Глобальный контекст настроек — тема, язык, компактный режим
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SettingsContext = createContext(null)

const STORAGE_KEY = 'bmi_appearance_prefs'
const DEFAULTS = { theme: 'light', language: 'uz', compact: false }

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS
    } catch { return DEFAULTS }
  })

  // Применяем тему к <html> элементу
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Тема
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) root.classList.add('dark')
      else root.classList.remove('dark')
    } else {
      root.classList.remove('dark')
    }

    // Компактный режим
    if (settings.compact) {
      root.classList.add('compact')
    } else {
      root.classList.remove('compact')
    }

    // Язык
    root.setAttribute('lang', settings.language === 'ru' ? 'ru' : 'uz')
  }, [settings])

  // Слушаем изменение системной темы
  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (e.matches) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const updateSettings = useCallback((key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

// ===== СИСТЕМА ПЕРЕВОДОВ =====
const TRANSLATIONS = {
  uz: {
    // Sidebar & Header
    'dashboard': 'Dashboard',
    'students': 'Talabalar',
    'subjects': 'Fanlar',
    'groups': 'Guruhlar',
    'risk': 'Xavf tahlili',
    'reports': 'Hisobotlar',
    'upload': "Ma'lumot yuklash",
    'users': 'Foydalanuvchilar',
    'settings': 'Sozlamalar',
    'profile': 'Profilim',
    'grades': 'Baholar',
    'logout': 'Chiqish',
    'system_name': 'BMI Tizimi',
    'system_subtitle': "O'zlashtirish tahlili",
    'login_title': 'Tizimga kirish',
    'login_placeholder': 'Loginni kiriting',
    'password_placeholder': 'Parolni kiriting',
    'login_btn': 'Kirish',
    'login_loading': 'Kirish...',
    'demo_logins': 'Demo loginlar:',
    'loading': 'Yuklanmoqda...',
    'error': 'Xatolik',
    'retry': 'Qayta urinish',
    'no_data': "Ma'lumot yo'q",
    'no_data_desc': "Hozircha ko'rsatadigan narsa yo'q.",

    // Settings tabs
    'tab_profile': 'Profil',
    'tab_security': 'Xavfsizlik',
    'tab_roles': 'Rollar va Ruxsatlar',
    'tab_notifications': 'Bildirishnomalar',
    'tab_appearance': 'Interfeys',
    'tab_about': 'Tizim haqida',

    // Profile
    'profile_info': "Profil ma'lumotlari",
    'first_name': 'Ism',
    'last_name': 'Familiya',
    'role': 'Rol',
    'save': 'Saqlash',
    'profile_updated': 'Profil muvaffaqiyatli yangilandi!',
    'fill_all_fields': "Barcha maydonlarni to'ldiring",

    // Security
    'change_password': "Parolni o'zgartirish",
    'security_desc': "Hisobingiz xavfsizligini ta'minlash uchun kuchli parol tanlang",
    'current_password': 'Joriy parol',
    'new_password': 'Yangi parol',
    'confirm_password': 'Parolni tasdiqlang',
    'min_chars': 'Kamida 6 ta belgi',
    'password_changed': "Parol muvaffaqiyatli o'zgartirildi!",
    'enter_new_password': 'Yangi parolni kiriting',
    'password_min_error': "Parol kamida 6 ta belgi bo'lishi kerak",
    'passwords_no_match': 'Parollar mos kelmaydi',
    'passwords_match': 'Parollar mos',
    'password_requirements': 'Parol talablari',
    'req_min_6': 'Kamida 6 ta belgi',
    'req_uppercase': 'Katta harf (A-Z)',
    'req_number': 'Raqam (0-9)',
    'req_special': 'Maxsus belgi (!@#$)',
    'strength_very_weak': 'Juda zaif',
    'strength_weak': 'Zaif',
    'strength_medium': "O'rtacha",
    'strength_strong': 'Kuchli',
    'strength_very_strong': 'Juda kuchli',

    // Roles
    'permissions_matrix': 'Ruxsatlar matritsasi',
    'click_to_toggle': 'Belgilash yoki olib tashlash uchun bosing',
    'unsaved_changes': "Saqlanmagan o'zgarishlar mavjud",
    'permissions_saved': 'Ruxsatlar muvaffaqiyatli saqlandi!',
    'reset': 'Qaytarish',
    'permissions_count': 'ta ruxsat',

    // Notifications
    'notification_settings': 'Bildirishnoma sozlamalari',
    'notification_desc': "Qaysi hodisalar haqida xabardor bo'lishni tanlang",
    'notif_new_grade': 'Yangi baho kiritilganda',
    'notif_new_grade_desc': "Talabaga yangi baho qo'yilganda bildirishnoma",
    'notif_risk_change': "Xavf darajasi o'zgarganda",
    'notif_risk_change_desc': "Talabaning xavf holati o'zgarganda ogohlantirish",
    'notif_system_update': 'Tizim yangilanganda',
    'notif_system_update_desc': 'Tizimga yangilanish kelganda xabar',
    'notif_weekly_report': 'Haftalik hisobot',
    'notif_weekly_report_desc': 'Har hafta umumiy statistika xulosa',

    // Appearance
    'theme': 'Mavzu (Theme)',
    'theme_desc': "Interfeys ko'rinishini tanlang",
    'theme_light': "Yorug'",
    'theme_light_desc': 'Oq fon',
    'theme_dark': "Qorong'i",
    'theme_dark_desc': 'Qora fon',
    'theme_system': 'Tizim',
    'theme_system_desc': 'Avtomatik',
    'language': 'Til (Language)',
    'language_desc': 'Interfeys tilini tanlang',
    'compact_mode': 'Ixcham rejim (Compact)',
    'compact_desc': "Jadvallar va elementlar yanada zichroq ko'rinadi",

    // About
    'system_title': "BMI Talabalar O'zlashtirish Tizimi",
    'system_description': "Diplom loyihasi — Talabalar o'zlashtirish ko'rsatkichlarini tahlil qilish",
    'api_server': 'API Server',
    'checking': 'Tekshirilmoqda...',
    'online': 'Online',
    'offline': 'Offline',
    'session_time': 'Sessiya vaqti',
    'token_duration': 'Token muddati',
    'hours_24': '24 soat',
    'technologies': 'Texnologiyalar',
    'swagger_docs': 'Swagger API Docs',
    'swagger_desc': 'Interaktiv API hujjatlari',

    // Permission labels
    'perm_view_dashboard': "Dashboard ko'rish",
    'perm_view_all_analytics': 'Barcha tahlillar',
    'perm_view_group_analytics': 'Guruh tahlillari',
    'perm_view_own_analytics': 'Shaxsiy tahlillar',
    'perm_view_predictions': 'Bashoratlar',
    'perm_view_settings': 'Sozlamalar',
    'perm_manage_users': 'Foydalanuvchilarni boshqarish',
    'perm_manage_students': 'Talabalarni boshqarish',
    'perm_manage_subjects': 'Fanlarni boshqarish',
    'perm_enter_grades': 'Baho kiritish',
    'perm_upload_data': "Ma'lumot yuklash",
    'perm_export_reports': 'Hisobot eksport',
    'perm_group_view': "Ko'rish",
    'perm_group_manage': 'Boshqarish',
    'perm_group_input': 'Kiritish',
    'perm_group_export': 'Eksport',

    // Roles
    'role_admin': 'Administrator',
    'role_dekanat': 'Dekanat',
    'role_oqituvchi': "O'qituvchi",
    'role_talaba': 'Talaba',
  },
  ru: {
    // Sidebar & Header
    'dashboard': 'Панель управления',
    'students': 'Студенты',
    'subjects': 'Предметы',
    'groups': 'Группы',
    'risk': 'Анализ рисков',
    'reports': 'Отчёты',
    'upload': 'Загрузка данных',
    'users': 'Пользователи',
    'settings': 'Настройки',
    'profile': 'Мой профиль',
    'grades': 'Оценки',
    'logout': 'Выход',
    'system_name': 'Система BMI',
    'system_subtitle': 'Анализ успеваемости',
    'login_title': 'Вход в систему',
    'login_placeholder': 'Введите логин',
    'password_placeholder': 'Введите пароль',
    'login_btn': 'Войти',
    'login_loading': 'Вход...',
    'demo_logins': 'Демо логины:',
    'loading': 'Загрузка...',
    'error': 'Ошибка',
    'retry': 'Повторить',
    'no_data': 'Нет данных',
    'no_data_desc': 'Пока нечего показывать.',

    // Settings tabs
    'tab_profile': 'Профиль',
    'tab_security': 'Безопасность',
    'tab_roles': 'Роли и разрешения',
    'tab_notifications': 'Уведомления',
    'tab_appearance': 'Интерфейс',
    'tab_about': 'О системе',

    // Profile
    'profile_info': 'Данные профиля',
    'first_name': 'Имя',
    'last_name': 'Фамилия',
    'role': 'Роль',
    'save': 'Сохранить',
    'profile_updated': 'Профиль успешно обновлён!',
    'fill_all_fields': 'Заполните все поля',

    // Security
    'change_password': 'Изменить пароль',
    'security_desc': 'Выберите надёжный пароль для защиты аккаунта',
    'current_password': 'Текущий пароль',
    'new_password': 'Новый пароль',
    'confirm_password': 'Подтверждение пароля',
    'min_chars': 'Минимум 6 символов',
    'password_changed': 'Пароль успешно изменён!',
    'enter_new_password': 'Введите новый пароль',
    'password_min_error': 'Пароль должен содержать минимум 6 символов',
    'passwords_no_match': 'Пароли не совпадают',
    'passwords_match': 'Пароли совпадают',
    'password_requirements': 'Требования к паролю',
    'req_min_6': 'Минимум 6 символов',
    'req_uppercase': 'Заглавная буква (A-Z)',
    'req_number': 'Цифра (0-9)',
    'req_special': 'Спецсимвол (!@#$)',
    'strength_very_weak': 'Очень слабый',
    'strength_weak': 'Слабый',
    'strength_medium': 'Средний',
    'strength_strong': 'Сильный',
    'strength_very_strong': 'Очень сильный',

    // Roles
    'permissions_matrix': 'Матрица разрешений',
    'click_to_toggle': 'Нажмите чтобы включить или выключить',
    'unsaved_changes': 'Есть несохранённые изменения',
    'permissions_saved': 'Разрешения успешно сохранены!',
    'reset': 'Сбросить',
    'permissions_count': 'разрешений',

    // Notifications
    'notification_settings': 'Настройки уведомлений',
    'notification_desc': 'Выберите о каких событиях получать уведомления',
    'notif_new_grade': 'Новая оценка',
    'notif_new_grade_desc': 'Уведомление при выставлении новой оценки',
    'notif_risk_change': 'Изменение уровня риска',
    'notif_risk_change_desc': 'Предупреждение при изменении статуса риска',
    'notif_system_update': 'Обновление системы',
    'notif_system_update_desc': 'Уведомление о новых обновлениях',
    'notif_weekly_report': 'Еженедельный отчёт',
    'notif_weekly_report_desc': 'Еженедельная сводка статистики',

    // Appearance
    'theme': 'Тема оформления',
    'theme_desc': 'Выберите внешний вид интерфейса',
    'theme_light': 'Светлая',
    'theme_light_desc': 'Белый фон',
    'theme_dark': 'Тёмная',
    'theme_dark_desc': 'Тёмный фон',
    'theme_system': 'Системная',
    'theme_system_desc': 'Автоматически',
    'language': 'Язык (Language)',
    'language_desc': 'Выберите язык интерфейса',
    'compact_mode': 'Компактный режим',
    'compact_desc': 'Таблицы и элементы становятся плотнее',

    // About
    'system_title': 'BMI — Система анализа успеваемости студентов',
    'system_description': 'Дипломный проект — анализ показателей успеваемости студентов',
    'api_server': 'API Сервер',
    'checking': 'Проверка...',
    'online': 'Онлайн',
    'offline': 'Офлайн',
    'session_time': 'Время сессии',
    'token_duration': 'Срок токена',
    'hours_24': '24 часа',
    'technologies': 'Технологии',
    'swagger_docs': 'Swagger API Docs',
    'swagger_desc': 'Интерактивная документация API',

    // Permission labels
    'perm_view_dashboard': 'Просмотр Dashboard',
    'perm_view_all_analytics': 'Вся аналитика',
    'perm_view_group_analytics': 'Аналитика групп',
    'perm_view_own_analytics': 'Личная аналитика',
    'perm_view_predictions': 'Прогнозы',
    'perm_view_settings': 'Настройки',
    'perm_manage_users': 'Управление пользователями',
    'perm_manage_students': 'Управление студентами',
    'perm_manage_subjects': 'Управление предметами',
    'perm_enter_grades': 'Ввод оценок',
    'perm_upload_data': 'Загрузка данных',
    'perm_export_reports': 'Экспорт отчётов',
    'perm_group_view': 'Просмотр',
    'perm_group_manage': 'Управление',
    'perm_group_input': 'Ввод',
    'perm_group_export': 'Экспорт',

    // Roles
    'role_admin': 'Администратор',
    'role_dekanat': 'Деканат',
    'role_oqituvchi': 'Преподаватель',
    'role_talaba': 'Студент',
  }
}

export function useTranslation() {
  const { settings } = useSettings()
  const lang = settings?.language || 'uz'

  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['uz']?.[key] || key
  }, [lang])

  return { t, lang }
}
