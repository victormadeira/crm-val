import {
  DarkTheme,
  NavigationContainer,
  type NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "./src/auth/store";
import type { RootStackParamList } from "./src/navigation/types";
import { registerPushAsync } from "./src/notifications";
import { LeadScreen } from "./src/screens/LeadScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { QueueScreen } from "./src/screens/QueueScreen";
import { theme } from "./src/theme";

type AuthedParams = RootStackParamList;
type UnauthedParams = { Login: undefined };

const AuthedStack = createNativeStackNavigator<AuthedParams>();
const UnauthedStack = createNativeStackNavigator<UnauthedParams>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    primary: theme.colors.accent,
    border: theme.colors.border,
    text: theme.colors.textPrimary,
    notification: theme.colors.accent,
  },
};

/**
 * Root do app. Boot lê SecureStore → decide se mostra Login ou o stack
 * autenticado. Ao entrar autenticado registra o ExpoPushToken no backend
 * (idempotente). Toque em notificação navega para o lead.
 */
export default function App(): JSX.Element {
  const booted = useAuthStore((s) => s.booted);
  const user = useAuthStore((s) => s.user);
  const boot = useAuthStore((s) => s.boot);
  const navRef = useRef<NavigationContainerRef<AuthedParams>>(null);

  useEffect(() => {
    void boot();
  }, [boot]);

  useEffect(() => {
    if (!user) return;
    void registerPushAsync();

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { type?: string; leadId?: string }
          | undefined;
        if (data?.type === "wa_message" && data.leadId) {
          navRef.current?.navigate("Lead", { leadId: data.leadId });
        }
      }
    );
    return () => sub.remove();
  }, [user]);

  if (!booted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme} ref={navRef}>
          {user ? (
            <AuthedStack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.textPrimary,
                headerTitleStyle: { fontWeight: "700" },
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <AuthedStack.Screen
                name="Queue"
                component={QueueScreen}
                options={{ headerShown: false }}
              />
              <AuthedStack.Screen
                name="Lead"
                component={LeadScreen}
                options={{ title: "Atendimento" }}
              />
            </AuthedStack.Navigator>
          ) : (
            <UnauthedStack.Navigator screenOptions={{ headerShown: false }}>
              <UnauthedStack.Screen name="Login" component={LoginScreen} />
            </UnauthedStack.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
