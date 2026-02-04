'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useCallback } from 'react';

// Timeout in milliseconds (e.g., 15 minutes)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export function AutoLogout() {
    const { data: session } = useSession();

    const handleLogout = useCallback(() => {
        if (session) {
            console.log('Auto-logging out due to inactivity');
            signOut({ callbackUrl: '/login' });
        }
    }, [session]);

    useEffect(() => {
        if (!session) return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
        };

        // Events to monitor
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        // Attach listeners
        events.forEach(event => document.addEventListener(event, resetTimer));

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [session, handleLogout]);

    return null; // This component handles logic only
}
