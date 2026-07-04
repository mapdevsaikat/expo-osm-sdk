import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import App from './App';

if (__DEV__) {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('🔴 GLOBAL ERROR:', error?.message);
    console.log('🔴 STACK:', error?.stack?.split('\n').slice(0, 8).join('\n'));
    originalHandler(error, isFatal);
  });
}

registerRootComponent(App);
