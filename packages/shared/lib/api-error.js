export function handleApiError(error, toast) {
  if (!toast || typeof toast !== 'function') return;

  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    const firstError = error.errors[0];
    toast({
      title: 'Validation Error',
      description: firstError?.message || 'Please check your input and try again.',
      variant: 'destructive',
    });
    return;
  }

  if (error?.status === 429) {
    toast({
      title: 'Too Many Requests',
      description: 'Please wait before trying again.',
      variant: 'destructive',
    });
    return;
  }

  toast({
    title: 'Error',
    description: error?.message || 'An error occurred. Please try again.',
    variant: 'destructive',
  });
}

export default handleApiError;
