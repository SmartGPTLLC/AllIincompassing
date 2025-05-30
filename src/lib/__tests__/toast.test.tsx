import { describe, it, expect, vi } from 'vitest';
import { showSuccess, showError, showInfo } from '../toast';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('Toast notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success toast with correct configuration', () => {
    showSuccess('Test success message');
    
    expect(toast.success).toHaveBeenCalledWith('Test success message', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#FFFFFF',
      },
    });
  });

  it('shows error toast with correct configuration', () => {
    const testError = new Error('Test error message');
    showError(testError);
    
    expect(toast.error).toHaveBeenCalledWith('Test error message', {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#FFFFFF',
      },
    });
  });

  it('shows info toast with correct configuration', () => {
    showInfo('Test info message');
    
    expect(toast.custom).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        position: 'top-right',
        duration: 4000,
      })
    );
  });

  it('handles non-Error objects in showError', () => {
    showError('String error message');
    
    expect(toast.error).toHaveBeenCalledWith('String error message', expect.any(Object));
  });
});