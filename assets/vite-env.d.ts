/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_AUTH_EMAIL?: string;
  readonly VITE_AUTH_PASSWORD?: string;
  readonly VITE_DEFAULT_LOCALE?: string;

  readonly VITE_ITEMS_PER_PAGE?: string;
  readonly VITE_CURRENCY?: string;

  readonly VITE_MAX_APPOINTMENT_DURATION?: string;
  readonly VITE_DEFAULT_APPOINTMENT_DURATION?: string;
  readonly VITE_CALENDAR_SLOT_DURATION_MINUTES?: string;
  readonly VITE_CALENDAR_FIRST_DAY?: string;
  readonly VITE_CALENDAR_SCROLL_TIME?: string;
  readonly VITE_CALENDAR_NARROW_SATURDAY?: string;
  readonly VITE_CALENDAR_NARROW_SUNDAY?: string;
  readonly VITE_CALENDAR_WEEKEND_WIDTH_PERCENT?: string;

  readonly VITE_COLOR_PRIMARY?: string;
  readonly VITE_COLOR_PRIMARY_LIGHT?: string;
  readonly VITE_COLOR_PRIMARY_HOVER?: string;
  readonly VITE_COLOR_PRIMARY_DARK?: string;
  readonly VITE_COLOR_PRIMARY_DARKER?: string;
  readonly VITE_COLOR_PRIMARY_SELECTED?: string;
  readonly VITE_COLOR_BTN_SUCCESS?: string;
  readonly VITE_COLOR_BTN_DANGER?: string;
  readonly VITE_COLOR_BTN_SECONDARY?: string;
  readonly VITE_COLOR_BTN_INFO?: string;
  readonly VITE_COLOR_CALENDAR_APPOINTMENT?: string;
  readonly VITE_COLOR_CALENDAR_OTHER?: string;
  readonly VITE_COLOR_CALENDAR_TEXT_OTHER?: string;
  readonly VITE_COLOR_CALENDAR_EVENT_DEFAULT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
