import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  HomeConfig,
  HomeSection,
  DEFAULT_HOME_CONFIG,
  DEFAULT_HOME_ORDER,
} from '@/lib/companionTypes';

const STORAGE_KEY = 'companion_home_config_v1';

export function useHomeConfig() {
  const [config, setConfig] = useLocalStorage<HomeConfig>(STORAGE_KEY, DEFAULT_HOME_CONFIG);

  // Merge persisted config with defaults so newly added sections appear.
  const merged: HomeConfig = {
    version: DEFAULT_HOME_CONFIG.version,
    order: [
      ...config.order.filter(s => DEFAULT_HOME_ORDER.includes(s)),
      ...DEFAULT_HOME_ORDER.filter(s => !config.order.includes(s)),
    ],
    visible: { ...DEFAULT_HOME_CONFIG.visible, ...config.visible },
  };

  const toggleSection = useCallback(
    (section: HomeSection) => {
      setConfig(prev => ({
        ...prev,
        version: DEFAULT_HOME_CONFIG.version,
        order: prev.order.length ? prev.order : DEFAULT_HOME_ORDER,
        visible: { ...DEFAULT_HOME_CONFIG.visible, ...prev.visible, [section]: !(prev.visible?.[section] ?? DEFAULT_HOME_CONFIG.visible[section]) },
      }));
    },
    [setConfig],
  );

  const moveSection = useCallback(
    (section: HomeSection, direction: -1 | 1) => {
      setConfig(prev => {
        const order = (prev.order.length ? prev.order : DEFAULT_HOME_ORDER).slice();
        const idx = order.indexOf(section);
        const swap = idx + direction;
        if (idx < 0 || swap < 0 || swap >= order.length) return prev;
        [order[idx], order[swap]] = [order[swap], order[idx]];
        return { ...prev, order };
      });
    },
    [setConfig],
  );

  const resetConfig = useCallback(() => setConfig(DEFAULT_HOME_CONFIG), [setConfig]);

  const isVisible = useCallback(
    (section: HomeSection) => merged.visible[section] ?? true,
    [merged],
  );

  return { config: merged, toggleSection, moveSection, resetConfig, isVisible };
}
