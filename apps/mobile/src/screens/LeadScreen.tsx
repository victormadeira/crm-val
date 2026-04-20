import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import { theme } from "../theme";
import type { RootStackParamList } from "../navigation/types";

interface Conversation {
  id: string;
  contactWaId: string;
  status: string;
  windowExpiresAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
}

interface WaMessage {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  kind: string;
  status: string;
  text: string | null;
  mediaUrl: string | null;
  createdAt: string;
}

type Props = NativeStackScreenProps<RootStackParamList, "Lead">;

/**
 * Tela de atendimento — mostra a conversa WhatsApp e permite responder
 * texto. A janela 24h do WhatsApp é destacada: fora da janela, o botão
 * ainda envia mas avisa que só template é aceito. Poll automático a cada
 * 10s para pegar novas mensagens sem depender do push chegar.
 */
export function LeadScreen({ route, navigation }: Props): JSX.Element {
  const { leadId, name } = route.params;
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<WaMessage>>(null);

  useEffect(() => {
    navigation.setOptions({ title: name ?? "Atendimento" });
  }, [navigation, name]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{
        conversations: Conversation[];
        messages: WaMessage[];
      }>(`/whatsapp/conversations/${leadId}?limit=200`);
      setConv(data.conversations[0] ?? null);
      // Backend ordena desc — invertemos para exibir asc (mais antigo em cima)
      setMessages([...data.messages].reverse());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao carregar conversa");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(), 10_000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: false })
      );
    }
  }, [messages.length]);

  const windowOpen =
    conv?.windowExpiresAt != null &&
    Date.parse(conv.windowExpiresAt) > Date.now();

  const send = async () => {
    if (!conv || sending) return;
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/whatsapp/messages/text`, {
        leadId,
        body,
      });
      setText("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={styles.flex}
      >
        <View style={styles.banner}>
          <Text
            style={[
              styles.bannerText,
              windowOpen
                ? { color: theme.colors.success }
                : { color: theme.colors.warning },
            ]}
          >
            {conv
              ? windowOpen
                ? "Janela WhatsApp aberta (24h)"
                : "Fora da janela — apenas templates"
              : "Sem conversa WhatsApp ainda"}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => <Bubble msg={item} />}
          ItemSeparatorComponent={() => (
            <View style={{ height: theme.spacing(1) }} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma mensagem.</Text>
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={
              conv ? "Digite sua resposta…" : "Cliente precisa iniciar contato"
            }
            placeholderTextColor={theme.colors.textFaint}
            multiline
            editable={!!conv && !sending}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!conv || sending || !text.trim()) && { opacity: 0.5 },
            ]}
            onPress={send}
            disabled={!conv || sending || !text.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg }: { msg: WaMessage }): JSX.Element {
  const mine = msg.direction === "OUTBOUND";
  return (
    <View
      style={[
        styles.bubble,
        mine ? styles.bubbleMine : styles.bubbleTheirs,
      ]}
    >
      {msg.text ? (
        <Text
          style={[styles.bubbleText, mine && { color: "#fff" }]}
        >
          {msg.text}
        </Text>
      ) : (
        <Text style={[styles.bubbleText, { fontStyle: "italic" }]}>
          [{msg.kind.toLowerCase()}]
        </Text>
      )}
      <Text style={styles.bubbleMeta}>
        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {mine ? ` · ${msg.status.toLowerCase()}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  banner: {
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(2),
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  bannerText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  messagesContainer: {
    padding: theme.spacing(3),
    flexGrow: 1,
  },
  empty: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing(10),
  },
  bubble: {
    maxWidth: "80%",
    padding: theme.spacing(2),
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  bubbleText: { color: theme.colors.textPrimary, fontSize: 14 },
  bubbleMeta: {
    color: theme.colors.textFaint,
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  error: {
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(1),
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: theme.spacing(2),
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing(2),
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing(4),
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "600" },
});
