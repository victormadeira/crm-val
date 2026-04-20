import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../auth/store";
import { theme } from "../theme";

export function LoginScreen(): JSX.Element {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text style={styles.brand}>VALPARAÍSO</Text>
          <Text style={styles.subtitle}>Atendimento CRM</Text>

          <View style={styles.card}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="voce@valparaiso.com"
              placeholderTextColor={theme.colors.textFaint}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!loading}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textFaint}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing(5),
  },
  brand: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(6),
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing(5),
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    fontSize: 16,
  },
  error: {
    color: theme.colors.danger,
    marginTop: theme.spacing(3),
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing(5),
    paddingVertical: theme.spacing(3),
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
