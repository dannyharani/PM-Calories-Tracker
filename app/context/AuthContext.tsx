// Deprecated location; shim to avoid expo-router warnings. Import from src/context/AuthContext instead.
import React from 'react';
// Re-export only the provider hook and types, avoiding duplicate default export names.
export { AuthContextType, AuthProvider, useAuth } from '../../src/context/AuthContext';

export default function AuthContextShim(): React.ReactElement | null {
	return null; // no UI; route shim only
}

