import toast from 'react-hot-toast';

export function showToast(message, type = 'success') {
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else if (type === 'loading') {
    toast.loading(message);
  } else {
    toast(message);
  }
}

export default function ToastProvider({ children }) {
  return children;
}