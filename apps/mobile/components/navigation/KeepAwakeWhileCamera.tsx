import { useKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

function ScreenAwakeLock() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  return null;
}

export function KeepAwakeWhileCamera() {
  const [focused, setFocused] = useState(false);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  return focused ? <ScreenAwakeLock /> : null;
}
