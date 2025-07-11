import { useState } from 'react';

interface NotificationState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showNotification = ({
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText,
    cancelText
  }: Omit<NotificationState, 'isOpen'>) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const showAlert = (message: string, title: string = 'Informasi') => {
    showNotification({ title, message, type: 'info' });
  };

  const showSuccess = (message: string, title: string = 'Berhasil') => {
    showNotification({ title, message, type: 'success' });
  };

  const showError = (message: string, title: string = 'Error') => {
    showNotification({ title, message, type: 'error' });
  };

  const showWarning = (message: string, title: string = 'Peringatan') => {
    showNotification({ title, message, type: 'warning' });
  };

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title: string = 'Konfirmasi',
    confirmText: string = 'Ya',
    cancelText: string = 'Tidak'
  ) => {
    showNotification({
      title,
      message,
      type: 'confirm',
      onConfirm,
      confirmText,
      cancelText
    });
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm
  };
};