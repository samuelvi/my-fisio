import { clearSessionToken, getSessionToken } from '../auth/sessionStore';
import { installUnauthorizedInterceptor, setAuthorizationToken } from '../api/httpClient';

const COLOR_VARS: Record<string, string | undefined> = {
  '--color-primary': import.meta.env.VITE_COLOR_PRIMARY as string,
  '--color-primary-light': import.meta.env.VITE_COLOR_PRIMARY_LIGHT as string,
  '--color-primary-dark': import.meta.env.VITE_COLOR_PRIMARY_DARK as string,
  '--color-primary-darker': import.meta.env.VITE_COLOR_PRIMARY_DARKER as string,
  '--color-primary-selected': import.meta.env.VITE_COLOR_PRIMARY_SELECTED as string,
  '--color-btn-success': import.meta.env.VITE_COLOR_BTN_SUCCESS as string,
  '--color-btn-danger': import.meta.env.VITE_COLOR_BTN_DANGER as string,
  '--color-btn-secondary': import.meta.env.VITE_COLOR_BTN_SECONDARY as string,
  '--color-btn-info': import.meta.env.VITE_COLOR_BTN_INFO as string,
  '--color-calendar-appointment': import.meta.env.VITE_COLOR_CALENDAR_APPOINTMENT as string,
  '--color-calendar-other': import.meta.env.VITE_COLOR_CALENDAR_OTHER as string,
  '--color-calendar-text-other': import.meta.env.VITE_COLOR_CALENDAR_TEXT_OTHER as string,
  '--color-calendar-event-default': import.meta.env.VITE_COLOR_CALENDAR_EVENT_DEFAULT as string,
};

let unauthorizedInterceptorInstalled = false;

function applyThemeVariables(): void {
  Object.entries(COLOR_VARS).forEach(([key, value]) => {
    if (value) {
      document.documentElement.style.setProperty(key, value);
    }
  });
}

function handleUnauthorizedSession(): void {
  clearSessionToken();
  setAuthorizationToken(null);

  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?expired=1';
  }
}

export function initializeFrontendBootstrap(enableUnauthorizedInterceptor: boolean): void {
  applyThemeVariables();
  setAuthorizationToken(getSessionToken());

  if (!enableUnauthorizedInterceptor || unauthorizedInterceptorInstalled) {
    return;
  }

  installUnauthorizedInterceptor(handleUnauthorizedSession);
  unauthorizedInterceptorInstalled = true;
}
