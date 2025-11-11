// Shim route component to satisfy expo-router default export requirement while re-exporting utility functions.
// Prefer importing from src/utils/alert for logic.
import React from 'react';
export { showAlert, showConfirm } from '../../src/utils/alert';

export default function AlertUtilitiesInfo(): React.ReactElement | null {
	// This is a non-route utility shim. Nothing to render.
	return null;
}

