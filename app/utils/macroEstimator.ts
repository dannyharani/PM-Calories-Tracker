// Shim route component to satisfy expo-router default export requirement while re-exporting estimator utilities.
import React from 'react';
export { MealType, estimateFromLabels, estimateFromMealType } from '../../src/utils/macroEstimator';

export default function MacroEstimatorUtilitiesInfo(): React.ReactElement | null {
	// This is a non-route utility shim. Nothing to render.
	return null;
}

