import { createContext, useContext } from 'react';

export const OnboardingContext = createContext({ complete: () => undefined as void });
export function useOnboarding() { return useContext(OnboardingContext); }
