import { useState } from 'react';
import type { SimulationMode, SimulationStep } from '../types/simulation';

export function useSimulation(modes: SimulationMode[], defaultModeId: string) {
  const [currentModeId, setCurrentModeId] = useState(defaultModeId);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentMode = modes.find(m => m.id === currentModeId) ?? modes[0];
  const currentStep: SimulationStep = currentMode.steps[currentStepIndex];
  const totalSteps = currentMode.steps.length;

  const changeMode = (modeId: string) => {
    setCurrentModeId(modeId);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  const reset = () => setCurrentStepIndex(0);

  return {
    currentMode,
    currentModeId,
    currentStep,
    currentStepIndex,
    totalSteps,
    changeMode,
    nextStep,
    prevStep,
    reset,
  };
}
