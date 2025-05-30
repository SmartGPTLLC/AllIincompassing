import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../auth';

describe('useAuth', () => {
  beforeEach(() => {
    // Clear the store before each test
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setUser(null);
    });
  });

  it('initializes with null user and loading true', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('updates user state when setUser is called', () => {
    const { result } = renderHook(() => useAuth());
    const mockUser = { id: '123', email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('handles sign in', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.loading).toBe(true);
  });

  it('handles sign out', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
  });
});