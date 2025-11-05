/**
 * Get status emoji based on tracking status
 */
export const getStatusEmoji = (status: string): string => {
  switch (status) {
    case 'active': return '✅';
    case 'starting': return '⏳';
    case 'stopping': return '⏳';
    case 'error': return '❌';
    case 'permission_required': return '🔐';
    case 'gps_disabled': return '📶';
    default: return '⭕';
  }
};

/**
 * Get error type emoji
 */
export const getErrorTypeEmoji = (errorType: string): string => {
  switch (errorType) {
    case 'permission_denied': return '🔐';
    case 'gps_disabled': return '📶';
    case 'no_signal': return '📡';
    case 'timeout': return '⏰';
    case 'view_not_ready': return '🗺️';
    default: return '❌';
  }
};

