import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import { useAuthStore } from "../auth/store";
import { theme } from "../theme";
import type { RootStackParamList } from "../navigation/types";

interface LeadRow {
  id: string;
  name: string;
  phoneE164: string;
  status: string;
  stageId: string | null;
  aiScore: number | null;
  lastContactAt: string | null;
  createdAt: string;
}

type Props = NativeStackScreenProps<RootStackParamList, "Queue">;

/**
 * Fila do atendente — lista os leads ativos atribuídos ao usuário logado.
 * Ordena por `lastContactAt` asc (os mais frios no topo) para priorizar
 * retomada. Pull-to-refresh atualiza.
 */
export function QueueScreen({ navigation }: Props): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await api.get<{ items: LeadRow[] }>(
        `/leads?ownerId=${user.userId}&pageSize=100`
      );
      const sorted = [...data.items].sort((a, b) => {
        const at = a.lastContactAt ? Date.parse(a.lastContactAt) : 0;
        const bt = b.lastContactAt ? Date.parse(b.lastContactAt) : 0;
        return at - bt;
      });
      setItems(sorted);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Falha ao carregar fila"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => void load());
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Minha fila</Text>
          <Text style={styles.subtitle}>
            {items.length} lead{items.length === 1 ? "" : "s"} ativo
            {items.length === 1 ? "" : "s"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => void logout()}
          accessibilityLabel="Sair"
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(l) => l.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: theme.spacing(4),
          paddingBottom: theme.spacing(8),
        }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing(2) }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum lead atribuído.</Text>
        }
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onPress={() =>
              navigation.navigate("Lead", { leadId: item.id, name: item.name })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function LeadCard({
  lead,
  onPress,
}: {
  lead: LeadRow;
  onPress: () => void;
}): JSX.Element {
  const last = lead.lastContactAt
    ? new Date(lead.lastContactAt)
    : new Date(lead.createdAt);
  const hoursAgo = Math.floor((Date.now() - last.getTime()) / 3_600_000);
  const slaBreaching = hoursAgo >= 4;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Abrir lead ${lead.name}`}
    >
      <View style={styles.cardRow}>
        <Text style={styles.cardName} numberOfLines={1}>
          {lead.name}
        </Text>
        {lead.aiScore !== null ? (
          <View style={styles.score}>
            <Text style={styles.scoreText}>{lead.aiScore}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardPhone}>{lead.phoneE164}</Text>
      <View style={styles.cardMetaRow}>
        <Text style={styles.status}>{lead.status}</Text>
        <Text
          style={[
            styles.ago,
            slaBreaching && { color: theme.colors.danger },
          ]}
        >
          {hoursAgo === 0 ? "Agora" : `${hoursAgo}h sem contato`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
  logoutText: { color: theme.colors.textPrimary, fontSize: 13 },
  error: {
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(2),
  },
  empty: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing(10),
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing(3),
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  cardPhone: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing(2),
  },
  status: {
    color: theme.colors.textFaint,
    fontSize: 12,
    letterSpacing: 1,
  },
  ago: { color: theme.colors.textMuted, fontSize: 12 },
  score: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: 2,
    marginLeft: theme.spacing(2),
  },
  scoreText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
