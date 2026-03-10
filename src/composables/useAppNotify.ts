import { Notify } from 'quasar';
import type { QNotifyCreateOptions } from 'quasar';

type NotifyOptions = Omit<QNotifyCreateOptions, 'type' | 'message' | 'position'>;

const DEFAULT_POSITION = 'top';

function notifyBase(type: 'positive' | 'negative' | 'warning' | 'info', message: string, options: NotifyOptions = {}) {
  const payload: QNotifyCreateOptions = {
    type,
    message,
    position: DEFAULT_POSITION,
    timeout: options.timeout ?? 3000,
  };

  if (options.icon !== undefined) payload.icon = options.icon;
  if (options.caption !== undefined) payload.caption = options.caption;
  if (options.actions !== undefined) payload.actions = options.actions;
  if (options.multiLine !== undefined) payload.multiLine = options.multiLine;
  if (options.html !== undefined) payload.html = options.html;
  if (options.progress !== undefined) payload.progress = options.progress;
  if (options.group !== undefined) payload.group = options.group;

  Notify.create(payload);
}

export function useAppNotify() {
  return {
    success(message: string, options: NotifyOptions = {}) {
      notifyBase('positive', message, {
        icon: options.icon ?? 'check_circle',
        timeout: options.timeout ?? 2200,
        ...options,
      });
    },

    error(message: string, options: NotifyOptions = {}) {
      notifyBase('negative', message, {
        icon: options.icon ?? 'error',
        timeout: options.timeout ?? 3200,
        ...options,
      });
    },

    warning(message: string, options: NotifyOptions = {}) {
      notifyBase('warning', message, {
        icon: options.icon ?? 'warning',
        timeout: options.timeout ?? 3200,
        ...options,
      });
    },

    info(message: string, options: NotifyOptions = {}) {
      notifyBase('info', message, {
        icon: options.icon ?? 'info',
        timeout: options.timeout ?? 3000,
        ...options,
      });
    },
  };
}
