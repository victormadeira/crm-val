import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Filter,
  GitBranch,
  LayoutGrid,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minus,
  MousePointer2,
  PenLine,
  Play,
  Plus,
  Power,
  Save,
  Split,
  Sparkles,
  StickyNote,
  Tag,
  Trash2,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { AutomationNode, AutomationNodeTipo } from "@/lib/types";

/* ────────────────────────── Types ────────────────────────── */

type RunStatus = "idle" | "running" | "done" | "error";

export interface EditorNode extends AutomationNode {
  owner?: { name: string; color?: string };
  progress?: number;
  status?: RunStatus;
  subtitle?: string;
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  text: string;
  color: "amber" | "violet" | "emerald" | "sky" | "rose";
}

export interface FlowEditorValue {
  nodes: EditorNode[];
  annotations?: Annotation[];
}

export interface FlowEditorProps {
  value: FlowEditorValue;
  onChange?: (next: FlowEditorValue) => void;
  readOnly?: boolean;
  className?: string;
  onSave?: () => void;
  onTest?: () => void;
  onToggleActive?: () => void;
  active?: boolean;
  title?: string;
  subtitle?: string;
}

/* ────────────────────────── Catalog ────────────────────────── */

const KIND_META: Record<
  AutomationNodeTipo,
  {
    label: string;
    accent: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  gatilho: { label: "Gatilho", accent: "emerald", dot: "#10b981", icon: Zap },
  condicao: { label: "Condição", accent: "violet", dot: "#8b5cf6", icon: Filter },
  acao: { label: "Ação", accent: "brand", dot: "#1e7be6", icon: MessageCircle },
  espera: { label: "Espera", accent: "amber", dot: "#f59e0b", icon: Clock },
  divisao: { label: "Divisão", accent: "sky", dot: "#0ea5e9", icon: Split },
  ia: { label: "IA", accent: "fuchsia", dot: "#d946ef", icon: Bot },
  fim: { label: "Fim", accent: "slate", dot: "#64748b", icon: CheckCircle2 },
};

const PALETTE: Array<{
  tipo: AutomationNodeTipo;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { tipo: "gatilho", label: "Gatilho", subtitle: "Evento que inicia o fluxo", icon: Zap },
  { tipo: "condicao", label: "Condição (fork)", subtitle: "Ramifica Sim / Não", icon: Filter },
  { tipo: "acao", label: "WhatsApp", subtitle: "Envia mensagem ou template", icon: MessageSquare },
  { tipo: "acao", label: "Tag", subtitle: "Aplica ou remove tag", icon: Tag },
  { tipo: "acao", label: "Atribuir corretor", subtitle: "Auto ou manual", icon: UserPlus },
  { tipo: "acao", label: "Atualizar campo", subtitle: "Stage, status, nota", icon: PenLine },
  { tipo: "espera", label: "Espera", subtitle: "Timer entre etapas", icon: Clock },
  { tipo: "divisao", label: "Divisão A/B", subtitle: "Split percentual", icon: Split },
  { tipo: "ia", label: "IA", subtitle: "Prompt Claude: classifica, responde, extrai", icon: Bot },
  { tipo: "fim", label: "Fim", subtitle: "Encerra o fluxo", icon: CheckCircle2 },
];

const NODE_W = 260;
const NODE_H = 96;

const ANNOTATION_COLORS: Record<
  Annotation["color"],
  { bg: string; border: string; text: string; accent: string }
> = {
  amber: { bg: "rgba(245,158,11,0.14)", border: "#f59e0b", text: "#fde68a", accent: "#f59e0b" },
  violet: { bg: "rgba(139,92,246,0.14)", border: "#8b5cf6", text: "#ddd6fe", accent: "#8b5cf6" },
  emerald: { bg: "rgba(16,185,129,0.14)", border: "#10b981", text: "#a7f3d0", accent: "#10b981" },
  sky: { bg: "rgba(14,165,233,0.14)", border: "#0ea5e9", text: "#bae6fd", accent: "#0ea5e9" },
  rose: { bg: "rgba(244,63,94,0.14)", border: "#f43f5e", text: "#fecdd3", accent: "#f43f5e" },
};

/* ────────────────────────── FlowEditor ────────────────────────── */

export function FlowEditor({
  value,
  onChange,
  readOnly = false,
  className,
  onSave,
  onTest,
  onToggleActive,
  active = false,
  title = "Fluxo sem título",
  subtitle,
}: FlowEditorProps) {
  // initial-only — deliberately NOT syncing from `value` on every render
  // (parent passes a fresh object each render; syncing would wipe local edits).
  const [nodes, setNodes] = useState<EditorNode[]>(() => value.nodes);
  const [annotations, setAnnotations] = useState<Annotation[]>(() => value.annotations ?? []);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [annotationDragId, setAnnotationDragId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{
    fromId: string;
    kind: "normal" | "yes" | "no";
  } | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Keep a ref in sync with latest nodes so pointer handlers never read stale closures.
  const nodesRef = useRef<EditorNode[]>(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  const annotationsRef = useRef<Annotation[]>(annotations);
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const edges = useMemo(() => {
    const list: Array<{ id: string; from: string; to: string; label?: string; kind: "normal" | "yes" | "no" }> = [];
    for (const n of nodes) {
      const outs = n.next ?? [];
      if (n.tipo === "condicao") {
        if (outs[0]) list.push({ id: `${n.id}_yes_${outs[0]}`, from: n.id, to: outs[0], label: "Sim", kind: "yes" });
        if (outs[1]) list.push({ id: `${n.id}_no_${outs[1]}`, from: n.id, to: outs[1], label: "Não", kind: "no" });
      } else {
        for (let j = 0; j < outs.length; j++) {
          list.push({ id: `${n.id}_${j}_${outs[j]}`, from: n.id, to: outs[j], kind: "normal" });
        }
      }
    }
    return list;
  }, [nodes]);

  const commit = useCallback(
    (nextNodes: EditorNode[], nextAnnotations?: Annotation[]) => {
      setNodes(nextNodes);
      if (nextAnnotations !== undefined) setAnnotations(nextAnnotations);
      onChange?.({
        nodes: nextNodes,
        annotations: nextAnnotations ?? annotations,
      });
    },
    [annotations, onChange]
  );

  /* ─── Drag (node) ─── */
  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    if (readOnly) return;
    if (editingLabelId === id) return; // let inline editing take over
    e.stopPropagation();
    const n = byId[id];
    setSelectedId(id);
    setSelectedAnnotation(null);
    setSelectedEdgeId(null);
    setDragId(id);
    dragStart.current = { x: e.clientX, y: e.clientY, nodeX: n.position.x, nodeY: n.position.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const findNodeAt = (worldX: number, worldY: number): EditorNode | null => {
    for (const n of nodesRef.current) {
      if (
        worldX >= n.position.x &&
        worldX <= n.position.x + NODE_W &&
        worldY >= n.position.y &&
        worldY <= n.position.y + NODE_H
      ) {
        return n;
      }
    }
    return null;
  };

  const onHandlePointerDown = (
    e: React.PointerEvent,
    fromId: string,
    kind: "normal" | "yes" | "no"
  ) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setConnecting({ fromId, kind });
    setCursorWorld(clientToWorld(e.clientX, e.clientY));
    setSelectedId(null);
    setSelectedEdgeId(null);
    const canvas = containerRef.current;
    if (canvas) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  /* ─── Drag (annotation) ─── */
  const onAnnotationPointerDown = (e: React.PointerEvent, id: string) => {
    if (readOnly) return;
    e.stopPropagation();
    const a = annotations.find((x) => x.id === id);
    if (!a) return;
    setSelectedAnnotation(id);
    setSelectedId(null);
    setAnnotationDragId(id);
    dragStart.current = { x: e.clientX, y: e.clientY, nodeX: a.x, nodeY: a.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  /* ─── Pan (canvas) ─── */
  const onCanvasPointerDown = (e: React.PointerEvent) => {
    // If we're already in connect mode, ignore — canvas has pointer capture.
    if (connecting) return;
    setSelectedId(null);
    setSelectedAnnotation(null);
    setSelectedEdgeId(null);
    setPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragId && dragStart.current) {
      const start = dragStart.current;
      const dx = (e.clientX - start.x) / zoom;
      const dy = (e.clientY - start.y) / zoom;
      const nextX = start.nodeX + dx;
      const nextY = start.nodeY + dy;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragId ? { ...n, position: { x: nextX, y: nextY } } : n
        )
      );
    } else if (annotationDragId && dragStart.current) {
      const start = dragStart.current;
      const dx = (e.clientX - start.x) / zoom;
      const dy = (e.clientY - start.y) / zoom;
      const nextX = start.nodeX + dx;
      const nextY = start.nodeY + dy;
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationDragId ? { ...a, x: nextX, y: nextY } : a
        )
      );
    } else if (connecting) {
      const world = clientToWorld(e.clientX, e.clientY);
      setCursorWorld(world);
      const hit = findNodeAt(world.x, world.y);
      setHoverTargetId(hit && hit.id !== connecting.fromId ? hit.id : null);
    } else if (panning && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    }
  };

  const onPointerUp = (e?: React.PointerEvent) => {
    if (dragId) {
      // Use ref for latest nodes to avoid stale closure.
      onChange?.({ nodes: nodesRef.current, annotations: annotationsRef.current });
      setDragId(null);
      dragStart.current = null;
    }
    if (annotationDragId) {
      onChange?.({ nodes: nodesRef.current, annotations: annotationsRef.current });
      setAnnotationDragId(null);
      dragStart.current = null;
    }
    if (connecting) {
      // Commit connection if pointer released over a valid target.
      const world = e ? clientToWorld(e.clientX, e.clientY) : cursorWorld;
      const target = world ? findNodeAt(world.x, world.y) : null;
      if (target && target.id !== connecting.fromId && target.tipo !== "gatilho") {
        const { fromId, kind } = connecting;
        const next = nodesRef.current.map((n) => {
          if (n.id !== fromId) return n;
          if (n.tipo === "condicao") {
            const prev = n.next ?? [];
            const arr = [prev[0] ?? "", prev[1] ?? ""] as [string, string];
            if (kind === "yes") arr[0] = target.id;
            if (kind === "no") arr[1] = target.id;
            return { ...n, next: arr.filter(Boolean) };
          }
          return { ...n, next: [target.id] };
        });
        commit(next);
      }
      setConnecting(null);
      setCursorWorld(null);
      setHoverTargetId(null);
    }
    if (panning) {
      setPanning(false);
      panStart.current = null;
    }
  };

  /* ─── Zoom ─── */
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => Math.min(2, Math.max(0.4, z + delta)));
  };

  const bump = (dir: 1 | -1) => setZoom((z) => Math.min(2, Math.max(0.4, z + dir * 0.1)));

  const fit = useCallback(() => {
    const pool = [
      ...nodes.map((n) => ({ x: n.position.x, y: n.position.y, w: NODE_W, h: NODE_H })),
      ...annotations.map((a) => ({ x: a.x, y: a.y, w: a.width, h: 90 })),
    ];
    if (pool.length === 0 || !containerRef.current) return;
    const minX = Math.min(...pool.map((p) => p.x));
    const maxX = Math.max(...pool.map((p) => p.x + p.w));
    const minY = Math.min(...pool.map((p) => p.y));
    const maxY = Math.max(...pool.map((p) => p.y + p.h));
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = (rect.width - 160) / (maxX - minX);
    const scaleY = (rect.height - 160) / (maxY - minY);
    const next = Math.min(1.2, Math.max(0.45, Math.min(scaleX, scaleY)));
    setZoom(next);
    setPan({
      x: rect.width / 2 - ((minX + maxX) / 2) * next,
      y: rect.height / 2 - ((minY + maxY) / 2) * next,
    });
  }, [nodes, annotations]);

  useEffect(() => {
    const t = window.setTimeout(fit, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Mutations ─── */
  const addNode = (tipo: AutomationNodeTipo, label: string, subtitleT?: string) => {
    if (readOnly) return;
    const id = `n_${Math.random().toString(36).slice(2, 8)}`;
    const center = containerRef.current
      ? {
          x: (containerRef.current.clientWidth / 2 - pan.x) / zoom - NODE_W / 2,
          y: (containerRef.current.clientHeight / 2 - pan.y) / zoom - NODE_H / 2,
        }
      : { x: 200, y: 200 };
    const next: EditorNode = {
      id,
      tipo,
      label,
      subtitle: subtitleT,
      position: center,
      next: [],
      config: {},
    };
    commit([...nodes, next]);
    setSelectedId(id);
  };

  const addAnnotation = () => {
    if (readOnly) return;
    const id = `a_${Math.random().toString(36).slice(2, 8)}`;
    const center = containerRef.current
      ? {
          x: (containerRef.current.clientWidth / 2 - pan.x) / zoom - 120,
          y: (containerRef.current.clientHeight / 2 - pan.y) / zoom - 40,
        }
      : { x: 200, y: 200 };
    const palette = ["amber", "violet", "emerald", "sky", "rose"] as const;
    const next: Annotation = {
      id,
      x: center.x,
      y: center.y,
      width: 240,
      text: "Nova seção do fluxo",
      color: palette[annotations.length % palette.length],
    };
    commit(nodes, [...annotations, next]);
    setSelectedAnnotation(id);
    setSelectedId(null);
  };

  const removeSelected = () => {
    if (selectedId) {
      const filtered = nodes
        .filter((n) => n.id !== selectedId)
        .map((n) => ({ ...n, next: (n.next ?? []).filter((id) => id !== selectedId) }));
      commit(filtered);
      setSelectedId(null);
    } else if (selectedAnnotation) {
      commit(
        nodes,
        annotations.filter((a) => a.id !== selectedAnnotation)
      );
      setSelectedAnnotation(null);
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      setSelectedEdgeId(null);
    }
  };

  const removeEdge = (edgeId: string) => {
    const found = edges.find((e) => e.id === edgeId);
    if (!found) return;
    const { from, to, kind } = found;
    const nextArr = nodes.map((n) => {
      if (n.id !== from) return n;
      if (n.tipo === "condicao") {
        const cur = n.next ?? [];
        const arr = [cur[0] ?? "", cur[1] ?? ""] as [string, string];
        if (kind === "yes") arr[0] = "";
        if (kind === "no") arr[1] = "";
        return { ...n, next: arr.filter(Boolean) };
      }
      return { ...n, next: (n.next ?? []).filter((x) => x !== to) };
    });
    commit(nextArr);
  };

  const updateSelected = (patch: Partial<EditorNode>) => {
    if (!selectedId) return;
    commit(nodes.map((n) => (n.id === selectedId ? { ...n, ...patch } : n)));
  };

  const updateAnnotation = (id: string, patch: Partial<Annotation>) => {
    commit(
      nodes,
      annotations.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  };

  /* ─── Auto-layout: topological left→right ─── */
  const autoLayout = () => {
    if (readOnly || nodes.length === 0) return;
    const incoming = new Map<string, number>();
    nodes.forEach((n) => incoming.set(n.id, 0));
    nodes.forEach((n) => (n.next ?? []).forEach((t) => incoming.set(t, (incoming.get(t) ?? 0) + 1)));

    const levels = new Map<string, number>();
    const queue: string[] = [];
    nodes.forEach((n) => {
      if ((incoming.get(n.id) ?? 0) === 0) {
        levels.set(n.id, 0);
        queue.push(n.id);
      }
    });
    if (queue.length === 0 && nodes[0]) {
      levels.set(nodes[0].id, 0);
      queue.push(nodes[0].id);
    }

    while (queue.length) {
      const id = queue.shift()!;
      const lvl = levels.get(id) ?? 0;
      const cur = byId[id];
      (cur?.next ?? []).forEach((t) => {
        const exists = levels.get(t);
        const nextLvl = lvl + 1;
        if (exists === undefined || exists < nextLvl) {
          levels.set(t, nextLvl);
          queue.push(t);
        }
      });
    }

    // group by level
    const byLevel = new Map<number, string[]>();
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) ?? 0;
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(n.id);
    });

    const COL_W = 340;
    const ROW_H = 140;
    const laidOut = nodes.map((n) => {
      const lvl = levels.get(n.id) ?? 0;
      const col = byLevel.get(lvl) ?? [];
      const row = col.indexOf(n.id);
      const colHeight = col.length * ROW_H;
      return {
        ...n,
        position: {
          x: lvl * COL_W,
          y: row * ROW_H - colHeight / 2 + 300,
        },
      };
    });
    commit(laidOut);
    setTimeout(fit, 60);
  };

  const selected = selectedId ? byId[selectedId] : null;
  const selectedAnn = selectedAnnotation ? annotations.find((a) => a.id === selectedAnnotation) ?? null : null;

  /* ─── Keyboard ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (readOnly) return;
      const tgt = e.target as HTMLElement;
      const isInput = tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable;
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        (selectedId || selectedAnnotation || selectedEdgeId) &&
        !isInput
      ) {
        e.preventDefault();
        removeSelected();
      }
      if (e.key === "Escape" && !isInput) {
        if (connecting) setConnecting(null);
        setSelectedEdgeId(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && !isInput) {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedAnnotation, selectedEdgeId, connecting, nodes, annotations]);

  return (
    <div className={cn("relative flex h-full w-full overflow-hidden bg-slate-950", className)}>
      {/* ───── Left palette ───── */}
      {!readOnly && (
        <aside className="w-[240px] shrink-0 border-r border-white/5 bg-slate-900/70 backdrop-blur flex flex-col">
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Paleta</div>
            <div className="text-[12px] text-slate-500 mt-0.5">Clique para adicionar</div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            {PALETTE.map((item, i) => {
              const meta = KIND_META[item.tipo];
              const Icon = item.icon ?? meta.icon;
              return (
                <button
                  key={i}
                  onClick={() => addNode(item.tipo, item.label, item.subtitle)}
                  className="w-full text-left group flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition"
                >
                  <div
                    className="h-8 w-8 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: `${meta.dot}22`, color: meta.dot }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-slate-100 truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-200 transition" />
                </button>
              );
            })}
            <div className="pt-2 mt-1 border-t border-white/5">
              <button
                onClick={addAnnotation}
                className="w-full text-left group flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-500/30 transition"
              >
                <div className="h-8 w-8 rounded-[8px] flex items-center justify-center shrink-0 bg-amber-500/15 text-amber-400">
                  <StickyNote className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-slate-100 truncate">Nota / seção</div>
                  <div className="text-[11px] text-slate-500 truncate">Texto livre no canvas</div>
                </div>
                <Plus className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition" />
              </button>
            </div>
          </div>
          <div className="border-t border-white/5 px-4 py-3">
            <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
              <Sparkles className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
              <span>
                Duplo-clique renomeia.
                <br />
                Ctrl/⌘+scroll zoom, Ctrl/⌘+S salva.
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* ───── Canvas ───── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-[12px] bg-slate-900/80 backdrop-blur border border-white/10 px-3 py-2 shadow-pop">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                active ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"
              )}
            />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white truncate max-w-[260px]">{title}</div>
              {subtitle && (
                <div className="text-[11px] text-slate-400 truncate max-w-[260px]">{subtitle}</div>
              )}
            </div>
          </div>

          <div className="ml-auto pointer-events-auto flex items-center gap-1.5 rounded-[12px] bg-slate-900/80 backdrop-blur border border-white/10 px-1.5 py-1.5 shadow-pop">
            {!readOnly && (
              <button
                onClick={autoLayout}
                className="h-7 px-2 rounded-[8px] text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 text-[11px] font-semibold"
                title="Organizar automaticamente"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Organizar
              </button>
            )}
            <div className="w-px h-5 bg-white/10 mx-0.5" />
            <button
              onClick={() => bump(-1)}
              className="h-7 w-7 rounded-[8px] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-semibold tabular text-slate-300 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => bump(1)}
              className="h-7 w-7 rounded-[8px] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={fit}
              className="h-7 w-7 rounded-[8px] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Fit"
              title="Encaixar"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {!readOnly && (
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-[12px] bg-slate-900/80 backdrop-blur border border-white/10 px-1.5 py-1.5 shadow-pop">
              {onTest && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="!text-slate-200 hover:!bg-white/10 !h-7"
                  leftIcon={<Play className="h-3.5 w-3.5" />}
                  onClick={onTest}
                >
                  Testar
                </Button>
              )}
              {onToggleActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "!h-7",
                    active ? "!text-emerald-400 hover:!bg-emerald-400/10" : "!text-slate-200 hover:!bg-white/10"
                  )}
                  leftIcon={<Power className="h-3.5 w-3.5" />}
                  onClick={onToggleActive}
                >
                  {active ? "Ativo" : "Pausado"}
                </Button>
              )}
              {onSave && (
                <Button size="sm" className="!h-7" leftIcon={<Save className="h-3.5 w-3.5" />} onClick={onSave}>
                  Salvar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Canvas surface */}
        <div
          ref={containerRef}
          className="absolute inset-0 flow-grid cursor-grab active:cursor-grabbing"
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <div
            className="absolute top-0 left-0 will-change-transform"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Annotations — behind nodes */}
            {annotations.map((a) => (
              <AnnotationBox
                key={a.id}
                annotation={a}
                selected={a.id === selectedAnnotation}
                readOnly={readOnly}
                onPointerDown={(e) => onAnnotationPointerDown(e, a.id)}
                onChange={(patch) => updateAnnotation(a.id, patch)}
                onDelete={() =>
                  commit(
                    nodes,
                    annotations.filter((x) => x.id !== a.id)
                  )
                }
              />
            ))}

            {/* Edges */}
            <svg
              width={6000}
              height={6000}
              className="absolute top-0 left-0 overflow-visible"
              style={{ pointerEvents: "none" }}
            >
              <defs>
                <linearGradient id="edge-normal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e7be6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="edge-yes" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="edge-no" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <radialGradient id="particle-normal" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1e7be6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="particle-yes" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#34d399" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="particle-no" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#fb923c" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>
                <marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
                </marker>
                <marker id="arrow-yes" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
                </marker>
                <marker id="arrow-no" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb923c" />
                </marker>
              </defs>
              {edges.map((e, i) => {
                const from = byId[e.from];
                const to = byId[e.to];
                if (!from || !to) return null;
                const isCond = from.tipo === "condicao";
                const outY =
                  from.position.y +
                  (isCond ? (e.kind === "yes" ? NODE_H * 0.35 : NODE_H * 0.75) : NODE_H / 2);
                const x1 = from.position.x + NODE_W;
                const y1 = outY;
                const x2 = to.position.x;
                const y2 = to.position.y + NODE_H / 2;
                const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
                const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                const gradRef =
                  e.kind === "yes" ? "url(#edge-yes)" : e.kind === "no" ? "url(#edge-no)" : "url(#edge-normal)";
                const marker =
                  e.kind === "yes" ? "url(#arrow-yes)" : e.kind === "no" ? "url(#arrow-no)" : "url(#arrow-normal)";
                const particleGrad =
                  e.kind === "yes" ? "url(#particle-yes)" : e.kind === "no" ? "url(#particle-no)" : "url(#particle-normal)";
                const baseColor = e.kind === "yes" ? "#10b981" : e.kind === "no" ? "#f43f5e" : "#1e7be6";
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                // Stronger ambient when source already ran
                const fromStatus = from.status ?? "idle";
                const energized = fromStatus === "running" || fromStatus === "done";

                const pathId = `edge-path-${i}`;
                const isSelected = selectedEdgeId === e.id;
                return (
                  <g key={e.id}>
                    {/* Hitbox — invisible fat stroke for clicking */}
                    <path
                      d={d}
                      stroke="transparent"
                      strokeWidth={16}
                      fill="none"
                      style={{ pointerEvents: "stroke", cursor: readOnly ? "default" : "pointer" }}
                      onPointerDown={(ev) => {
                        if (readOnly) return;
                        ev.stopPropagation();
                        setSelectedEdgeId(e.id);
                        setSelectedId(null);
                        setSelectedAnnotation(null);
                      }}
                    />
                    <path
                      d={d}
                      stroke={baseColor}
                      strokeWidth={isSelected ? 14 : 8}
                      fill="none"
                      strokeOpacity={isSelected ? 0.55 : energized ? 0.28 : 0.16}
                      strokeLinecap="round"
                      className="flow-halo"
                    />
                    <path
                      id={pathId}
                      d={d}
                      stroke={gradRef}
                      strokeWidth={isSelected ? 3 : 2}
                      fill="none"
                      strokeLinecap="round"
                      markerEnd={marker}
                    />
                    <path
                      d={d}
                      stroke={gradRef}
                      strokeWidth={2.5}
                      fill="none"
                      strokeLinecap="round"
                      className="flow-dash"
                      style={{ opacity: 0.9 }}
                    />
                    {/* Flowing glow particles — always run along every edge */}
                    <circle r={6} fill={particleGrad}>
                      <animateMotion
                        dur="2.6s"
                        repeatCount="indefinite"
                        rotate="auto"
                        begin={`${(i * 0.25) % 2.6}s`}
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                      <animate
                        attributeName="r"
                        values="3;7;3"
                        dur="2.6s"
                        repeatCount="indefinite"
                        begin={`${(i * 0.25) % 2.6}s`}
                      />
                    </circle>
                    <circle r={3.5} fill={particleGrad} opacity={0.65}>
                      <animateMotion
                        dur="2.6s"
                        repeatCount="indefinite"
                        rotate="auto"
                        begin={`${(i * 0.25 + 1.3) % 2.6}s`}
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                    {e.label && (
                      <g>
                        <rect
                          x={midX - 16}
                          y={midY - 9}
                          width={32}
                          height={18}
                          rx={6}
                          fill="#0b1220"
                          stroke={e.kind === "yes" ? "#10b981" : "#f43f5e"}
                          strokeWidth={1}
                        />
                        <text
                          x={midX}
                          y={midY + 4}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={700}
                          fill={e.kind === "yes" ? "#34d399" : "#fb7185"}
                        >
                          {e.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Ghost line while connecting */}
              {connecting && cursorWorld && (() => {
                const from = byId[connecting.fromId];
                if (!from) return null;
                const outY =
                  from.position.y +
                  (from.tipo === "condicao"
                    ? connecting.kind === "yes"
                      ? NODE_H * 0.35
                      : NODE_H * 0.75
                    : NODE_H / 2);
                const x1 = from.position.x + NODE_W;
                const y1 = outY;
                const x2 = cursorWorld.x;
                const y2 = cursorWorld.y;
                const dxg = Math.max(40, Math.abs(x2 - x1) * 0.45);
                const d = `M ${x1} ${y1} C ${x1 + dxg} ${y1}, ${x2 - dxg} ${y2}, ${x2} ${y2}`;
                const ghostColor =
                  connecting.kind === "yes"
                    ? "#34d399"
                    : connecting.kind === "no"
                      ? "#fb7185"
                      : "#22d3ee";
                return (
                  <g>
                    <path
                      d={d}
                      stroke={ghostColor}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      fill="none"
                      strokeLinecap="round"
                      opacity={0.9}
                    />
                    <circle cx={x2} cy={y2} r={5} fill={ghostColor} opacity={0.9} />
                  </g>
                );
              })()}
            </svg>

            {/* Nodes */}
            {nodes.map((n) => (
              <NodeCard
                key={n.id}
                node={n}
                selected={n.id === selectedId}
                editing={editingLabelId === n.id}
                readOnly={readOnly}
                isHoverTarget={connecting != null && hoverTargetId === n.id}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                onHandlePointerDown={(e, kind) => onHandlePointerDown(e, n.id, kind)}
                onDoubleClick={() => !readOnly && setEditingLabelId(n.id)}
                onRenameCommit={(label) => {
                  commit(nodes.map((x) => (x.id === n.id ? { ...x, label } : x)));
                  setEditingLabelId(null);
                }}
                onRenameCancel={() => setEditingLabelId(null)}
              />
            ))}
          </div>

          {/* MiniMap */}
          {nodes.length > 0 && <MiniMap nodes={nodes} pan={pan} zoom={zoom} containerRef={containerRef} />}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="h-12 w-12 rounded-[14px] bg-white/5 border border-white/10 mx-auto flex items-center justify-center">
                  <MousePointer2 className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-[13px] font-semibold text-slate-200 mt-3">Canvas vazio</div>
                <div className="text-[12px] text-slate-500 mt-1">Clique em um item da paleta para começar</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───── Right inspector ───── */}
      {selected ? (
        <Inspector
          node={selected}
          onChange={updateSelected}
          onDelete={removeSelected}
          onClose={() => setSelectedId(null)}
          readOnly={readOnly}
        />
      ) : selectedAnn ? (
        <AnnotationInspector
          annotation={selectedAnn}
          onChange={(patch) => updateAnnotation(selectedAnn.id, patch)}
          onDelete={removeSelected}
          onClose={() => setSelectedAnnotation(null)}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}

/* ────────────────────────── NodeCard ────────────────────────── */

function NodeCard({
  node,
  selected,
  editing,
  readOnly,
  isHoverTarget,
  onPointerDown,
  onHandlePointerDown,
  onDoubleClick,
  onRenameCommit,
  onRenameCancel,
}: {
  node: EditorNode;
  selected: boolean;
  editing: boolean;
  readOnly: boolean;
  isHoverTarget: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onHandlePointerDown: (e: React.PointerEvent, kind: "normal" | "yes" | "no") => void;
  onDoubleClick: () => void;
  onRenameCommit: (label: string) => void;
  onRenameCancel: () => void;
}) {
  const meta = KIND_META[node.tipo];
  const Icon = meta.icon;
  const isCond = node.tipo === "condicao";
  const isStart = node.tipo === "gatilho";
  const isEnd = node.tipo === "fim";
  const accent = meta.dot;
  const progress = typeof node.progress === "number" ? Math.max(0, Math.min(1, node.progress)) : null;
  const status =
    node.status ?? (progress === 1 ? "done" : progress != null && progress > 0 ? "running" : "idle");

  const owner = node.owner;
  const initial = owner?.name ? owner.name.charAt(0).toUpperCase() : meta.label.charAt(0);
  const avatarColor = owner?.color ?? accent;

  const [draft, setDraft] = useState(node.label);
  useEffect(() => setDraft(node.label), [node.label, editing]);

  const cardShadow = selected
    ? `0 0 0 1.5px ${accent}, 0 14px 40px -10px ${accent}55`
    : status === "running"
      ? `0 0 0 1px ${accent}55, 0 12px 34px -14px ${accent}66`
      : "0 10px 26px -14px rgba(0,0,0,0.7)";

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="absolute select-none cursor-grab active:cursor-grabbing"
      style={{ left: node.position.x, top: node.position.y, width: NODE_W, minHeight: NODE_H }}
    >
      {status === "running" && (
        <div
          aria-hidden
          className="absolute -inset-3 -z-10 rounded-[20px] pointer-events-none flow-halo"
          style={{
            background: `radial-gradient(60% 60% at 50% 50%, ${accent}55 0%, ${accent}14 40%, transparent 75%)`,
            filter: "blur(8px)",
          }}
        />
      )}

      <div
        className="relative rounded-[14px] bg-slate-900/95 backdrop-blur-sm transition-shadow duration-150"
        style={{
          border: `1px solid ${selected ? accent : "rgba(255,255,255,0.08)"}`,
          boxShadow: cardShadow,
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[14px]"
          style={{ background: accent }}
        />

        <div className="pl-4 pr-3 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold text-white relative",
                status === "running" && "flow-node-pulse"
              )}
              style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}
            >
              {isStart ? (
                <Play className="h-4 w-4 fill-white" />
              ) : isEnd ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                initial
              )}
              {status === "done" && !isStart && !isEnd && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="h-2 w-2 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: accent }}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                {isCond && (
                  <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5">
                    <GitBranch className="h-2.5 w-2.5" /> fork
                  </span>
                )}
                {owner?.name && (
                  <span className="text-[10px] text-slate-500 truncate">· {owner.name}</span>
                )}
              </div>
              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => onRenameCommit(draft.trim() || node.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameCommit(draft.trim() || node.label);
                    if (e.key === "Escape") onRenameCancel();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-[13px] font-semibold text-white border-b border-white/20 focus:outline-none focus:border-white/60 mt-0.5"
                />
              ) : (
                <div className="text-[13px] font-semibold text-white truncate mt-0.5">{node.label}</div>
              )}
              {node.subtitle && !editing && (
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{node.subtitle}</div>
              )}
            </div>
          </div>

          {progress !== null && (
            <div className="mt-2.5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
                    boxShadow: progress > 0 ? `0 0 10px ${accent}66` : "none",
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] tabular">
                <span className="text-slate-500">
                  {status === "done" ? "concluído" : status === "running" ? "executando…" : "aguardando"}
                </span>
                <span className="text-slate-300 font-semibold">{Math.round(progress * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Output handles */}
        {!isEnd && !isCond && (
          <button
            type="button"
            aria-label="Conectar"
            onPointerDown={(e) => !readOnly && onHandlePointerDown(e, "normal")}
            className={cn(
              "absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-slate-900 transition-all",
              !readOnly && "cursor-crosshair hover:scale-125 hover:ring-2 hover:ring-white/30"
            )}
            style={{ background: accent, touchAction: "none" }}
          />
        )}
        {!isEnd && isCond && (
          <>
            <button
              type="button"
              aria-label="Conectar saída Sim"
              onPointerDown={(e) => !readOnly && onHandlePointerDown(e, "yes")}
              className={cn(
                "absolute -right-2 h-4 w-4 rounded-full border-2 border-slate-900 transition-all",
                !readOnly && "cursor-crosshair hover:scale-125 hover:ring-2 hover:ring-white/30"
              )}
              style={{ top: `${NODE_H * 0.35 - 8}px`, background: "#10b981", touchAction: "none" }}
            />
            <button
              type="button"
              aria-label="Conectar saída Não"
              onPointerDown={(e) => !readOnly && onHandlePointerDown(e, "no")}
              className={cn(
                "absolute -right-2 h-4 w-4 rounded-full border-2 border-slate-900 transition-all",
                !readOnly && "cursor-crosshair hover:scale-125 hover:ring-2 hover:ring-white/30"
              )}
              style={{ top: `${NODE_H * 0.75 - 8}px`, background: "#f43f5e", touchAction: "none" }}
            />
          </>
        )}
        {/* Input handle */}
        {!isStart && (
          <span
            className={cn(
              "absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-slate-900 transition-all pointer-events-none",
              isHoverTarget ? "bg-emerald-400 ring-2 ring-emerald-400/50 scale-125" : "bg-slate-500"
            )}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── AnnotationBox ────────────────────────── */

function AnnotationBox({
  annotation,
  selected,
  readOnly,
  onPointerDown,
  onChange,
  onDelete,
}: {
  annotation: Annotation;
  selected: boolean;
  readOnly: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onChange: (patch: Partial<Annotation>) => void;
  onDelete: () => void;
}) {
  const colors = ANNOTATION_COLORS[annotation.color];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(annotation.text);
  useEffect(() => setDraft(annotation.text), [annotation.text]);

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!readOnly) setEditing(true);
      }}
      className={cn(
        "absolute rounded-[12px] transition-shadow",
        "cursor-grab active:cursor-grabbing"
      )}
      style={{
        left: annotation.x,
        top: annotation.y,
        width: annotation.width,
        background: colors.bg,
        border: `1.5px dashed ${colors.border}`,
        boxShadow: selected ? `0 0 0 2px ${colors.border}, 0 8px 24px -6px ${colors.border}66` : "none",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-dashed"
        style={{ borderColor: `${colors.border}66` }}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: colors.accent }}>
          <StickyNote className="h-3 w-3" />
          Seção
        </div>
        {selected && !readOnly && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-5 w-5 rounded-[5px] flex items-center justify-center hover:bg-white/10"
            style={{ color: colors.text }}
            aria-label="Excluir nota"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onChange({ text: draft });
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(annotation.text);
              setEditing(false);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          rows={3}
          className="block w-full bg-transparent px-3 py-2 text-[13px] font-semibold focus:outline-none resize-none"
          style={{ color: colors.text }}
        />
      ) : (
        <div
          className="px-3 py-2 text-[13px] font-semibold leading-snug whitespace-pre-wrap"
          style={{ color: colors.text }}
        >
          {annotation.text || "Duplo-clique para editar"}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── MiniMap ────────────────────────── */

function MiniMap({
  nodes,
  pan,
  zoom,
  containerRef,
}: {
  nodes: EditorNode[];
  pan: { x: number; y: number };
  zoom: number;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const minX = Math.min(...nodes.map((n) => n.position.x)) - 40;
  const maxX = Math.max(...nodes.map((n) => n.position.x + NODE_W)) + 40;
  const minY = Math.min(...nodes.map((n) => n.position.y)) - 40;
  const maxY = Math.max(...nodes.map((n) => n.position.y + NODE_H)) + 40;
  const w = maxX - minX;
  const h = maxY - minY;
  const MAP_W = 180;
  const MAP_H = 120;
  const scale = Math.min(MAP_W / w, MAP_H / h);

  const rect = containerRef.current?.getBoundingClientRect();
  const viewX = rect ? (-pan.x) / zoom : 0;
  const viewY = rect ? (-pan.y) / zoom : 0;
  const viewW = rect ? rect.width / zoom : 0;
  const viewH = rect ? rect.height / zoom : 0;

  return (
    <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
      <div
        className="rounded-[10px] border border-white/10 bg-slate-900/80 backdrop-blur p-2 shadow-pop"
        style={{ width: MAP_W + 16, height: MAP_H + 16 }}
      >
        <svg width={MAP_W} height={MAP_H} className="block">
          <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#0b1220" rx={6} />
          {nodes.map((n) => {
            const meta = KIND_META[n.tipo];
            return (
              <rect
                key={n.id}
                x={(n.position.x - minX) * scale}
                y={(n.position.y - minY) * scale}
                width={NODE_W * scale}
                height={NODE_H * scale}
                fill={meta.dot}
                opacity={0.85}
                rx={2}
              />
            );
          })}
          <rect
            x={(viewX - minX) * scale}
            y={(viewY - minY) * scale}
            width={viewW * scale}
            height={viewH * scale}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        </svg>
      </div>
    </div>
  );
}

/* ────────────────────────── Inspectors ────────────────────────── */

function Inspector({
  node,
  onChange,
  onDelete,
  onClose,
  readOnly,
}: {
  node: EditorNode;
  onChange: (patch: Partial<EditorNode>) => void;
  onDelete: () => void;
  onClose: () => void;
  readOnly: boolean;
}) {
  const meta = KIND_META[node.tipo];
  const Icon = meta.icon;
  return (
    <aside className="w-[320px] shrink-0 border-l border-white/5 bg-slate-900/80 backdrop-blur flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 flex items-start gap-2">
        <div
          className="h-8 w-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: `${meta.dot}22`, color: meta.dot }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: meta.dot }}>
            {meta.label}
          </div>
          <div className="text-[13px] font-semibold text-white truncate">{node.label}</div>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-[6px] text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label="Título">
          <input
            disabled={readOnly}
            value={node.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full h-9 rounded-[8px] bg-slate-800/80 border border-white/10 px-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </Field>
        <Field label="Descrição">
          <input
            disabled={readOnly}
            value={node.subtitle ?? ""}
            placeholder="ex.: envia template de boas-vindas"
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="w-full h-9 rounded-[8px] bg-slate-800/80 border border-white/10 px-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </Field>
        <Field label="Responsável (avatar)">
          <div className="flex items-center gap-2">
            <input
              disabled={readOnly}
              value={node.owner?.name ?? ""}
              placeholder="Orion, Luna, Atlas…"
              onChange={(e) =>
                onChange({
                  owner: e.target.value ? { name: e.target.value, color: node.owner?.color ?? meta.dot } : undefined,
                })
              }
              className="flex-1 h-9 rounded-[8px] bg-slate-800/80 border border-white/10 px-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
            <input
              type="color"
              disabled={readOnly}
              value={node.owner?.color ?? meta.dot}
              onChange={(e) =>
                onChange({
                  owner: { name: node.owner?.name ?? "", color: e.target.value },
                })
              }
              className="h-9 w-9 rounded-[8px] bg-slate-800/80 border border-white/10 cursor-pointer"
            />
          </div>
        </Field>

        <div className="pt-3 border-t border-white/5">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
            Configuração
          </div>
          <NodeConfigPanel node={node} onChange={onChange} readOnly={readOnly} />
        </div>

        <div className="pt-3 border-t border-white/5">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
            Execução
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Status: <span className="text-slate-300 font-semibold">{node.status ?? "idle"}</span>
            <br />
            Progresso:{" "}
            <span className="text-slate-300 font-semibold tabular">
              {node.progress != null ? `${Math.round(node.progress * 100)}%` : "—"}
            </span>
            <br />
            Conexões saída:{" "}
            <span className="text-slate-300 font-semibold tabular">{(node.next ?? []).length}</span>
          </div>
        </div>

        {node.tipo === "condicao" && (
          <div className="rounded-[10px] border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold mb-2">
              <GitBranch className="h-3 w-3 text-violet-400" /> Ramificação
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Sim →{" "}
                <span className="text-slate-300">{node.next?.[0] ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Não →{" "}
                <span className="text-slate-300">{node.next?.[1] ?? "—"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="border-t border-white/5 px-4 py-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="!text-rose-300 hover:!bg-rose-500/10 flex-1"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onDelete}
          >
            Excluir node
          </Button>
        </div>
      )}
    </aside>
  );
}

function AnnotationInspector({
  annotation,
  onChange,
  onDelete,
  onClose,
  readOnly,
}: {
  annotation: Annotation;
  onChange: (patch: Partial<Annotation>) => void;
  onDelete: () => void;
  onClose: () => void;
  readOnly: boolean;
}) {
  const colors = ANNOTATION_COLORS[annotation.color];
  return (
    <aside className="w-[320px] shrink-0 border-l border-white/5 bg-slate-900/80 backdrop-blur flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 flex items-start gap-2">
        <div
          className="h-8 w-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: colors.bg, color: colors.accent }}
        >
          <StickyNote className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: colors.accent }}>
            Nota / seção
          </div>
          <div className="text-[13px] font-semibold text-white truncate">Anotação</div>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-[6px] text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label="Texto">
          <textarea
            disabled={readOnly}
            value={annotation.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={5}
            className="w-full rounded-[8px] bg-slate-800/80 border border-white/10 px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 resize-none"
          />
        </Field>
        <Field label="Cor">
          <div className="flex items-center gap-2">
            {(["amber", "violet", "emerald", "sky", "rose"] as const).map((c) => (
              <button
                key={c}
                disabled={readOnly}
                onClick={() => onChange({ color: c })}
                aria-label={c}
                className={cn(
                  "h-7 w-7 rounded-[6px] border transition",
                  annotation.color === c ? "ring-2 ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                )}
                style={{
                  background: ANNOTATION_COLORS[c].bg,
                  borderColor: ANNOTATION_COLORS[c].border,
                }}
              />
            ))}
          </div>
        </Field>
        <Field label="Largura">
          <input
            disabled={readOnly}
            type="range"
            min={160}
            max={480}
            step={10}
            value={annotation.width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className="w-full accent-brand-500"
          />
          <div className="text-[11px] text-slate-500 tabular mt-1">{annotation.width}px</div>
        </Field>
      </div>
      {!readOnly && (
        <div className="border-t border-white/5 px-4 py-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="!text-rose-300 hover:!bg-rose-500/10 flex-1"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onDelete}
          >
            Excluir nota
          </Button>
        </div>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ────────────────────────── NodeConfigPanel ────────────────────────── */

const INPUT_CLS =
  "w-full h-9 rounded-[8px] bg-slate-800/80 border border-white/10 px-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500";
const TEXTAREA_CLS =
  "w-full rounded-[8px] bg-slate-800/80 border border-white/10 px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 resize-none font-mono";
const SELECT_CLS = INPUT_CLS;

function cfg<T = unknown>(node: EditorNode, key: string, fallback: T): T {
  const c = node.config ?? {};
  const v = c[key];
  return (v === undefined ? fallback : (v as T));
}

function patchConfig(
  node: EditorNode,
  onChange: (patch: Partial<EditorNode>) => void,
  updates: Record<string, unknown>
) {
  onChange({ config: { ...(node.config ?? {}), ...updates } });
}

function NodeConfigPanel({
  node,
  onChange,
  readOnly,
}: {
  node: EditorNode;
  onChange: (patch: Partial<EditorNode>) => void;
  readOnly: boolean;
}) {
  const disabled = readOnly;
  const set = (updates: Record<string, unknown>) => patchConfig(node, onChange, updates);

  if (node.tipo === "gatilho") {
    const trigger = cfg<string>(node, "trigger", "LEAD_CREATED");
    const TRIGGERS: Array<[string, string]> = [
      ["LEAD_CREATED", "Lead criado"],
      ["MESSAGE_RECEIVED", "Mensagem recebida"],
      ["NO_REPLY_TIMEOUT", "Sem resposta (timeout)"],
      ["TAG_APPLIED", "Tag aplicada"],
      ["STAGE_CHANGED", "Etapa alterada"],
      ["SCORE_THRESHOLD_CROSSED", "Score cruzou limite"],
      ["SCHEDULED_CRON", "Agendado (cron)"],
    ];
    return (
      <div className="space-y-3">
        <Field label="Tipo de gatilho">
          <select
            disabled={disabled}
            value={String(trigger)}
            onChange={(e) => set({ trigger: e.target.value })}
            className={SELECT_CLS}
          >
            {TRIGGERS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        {trigger === "TAG_APPLIED" && (
          <Field label="Tag">
            <input
              disabled={disabled}
              value={cfg<string>(node, "tag", "")}
              onChange={(e) => set({ tag: e.target.value })}
              placeholder="ex.: quente"
              className={INPUT_CLS}
            />
          </Field>
        )}
        {trigger === "STAGE_CHANGED" && (
          <Field label="Etapa alvo">
            <input
              disabled={disabled}
              value={cfg<string>(node, "stage", "")}
              onChange={(e) => set({ stage: e.target.value })}
              placeholder="ex.: proposta_enviada"
              className={INPUT_CLS}
            />
          </Field>
        )}
        {trigger === "NO_REPLY_TIMEOUT" && (
          <Field label="Tempo sem resposta (horas)">
            <input
              type="number"
              min={1}
              disabled={disabled}
              value={cfg<number>(node, "hours", 24)}
              onChange={(e) => set({ hours: Number(e.target.value) })}
              className={INPUT_CLS}
            />
          </Field>
        )}
        {trigger === "SCORE_THRESHOLD_CROSSED" && (
          <>
            <Field label="Limite">
              <input
                type="number"
                disabled={disabled}
                value={cfg<number>(node, "threshold", 70)}
                onChange={(e) => set({ threshold: Number(e.target.value) })}
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Direção">
              <select
                disabled={disabled}
                value={cfg<string>(node, "direction", "above")}
                onChange={(e) => set({ direction: e.target.value })}
                className={SELECT_CLS}
              >
                <option value="above">Ultrapassa (acima)</option>
                <option value="below">Cai abaixo</option>
              </select>
            </Field>
          </>
        )}
        {trigger === "SCHEDULED_CRON" && (
          <Field label="Cron (5 campos)">
            <input
              disabled={disabled}
              value={cfg<string>(node, "cron", "0 9 * * *")}
              onChange={(e) => set({ cron: e.target.value })}
              placeholder="0 9 * * *"
              className={INPUT_CLS}
            />
          </Field>
        )}
      </div>
    );
  }

  if (node.tipo === "condicao") {
    return (
      <div className="space-y-3">
        <Field label="Campo">
          <select
            disabled={disabled}
            value={cfg<string>(node, "field", "score")}
            onChange={(e) => set({ field: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="score">score</option>
            <option value="stage">stage</option>
            <option value="status">status</option>
            <option value="origem">origem</option>
            <option value="tag">tag (aplicada?)</option>
            <option value="custom">custom (JSON path)</option>
          </select>
        </Field>
        <Field label="Operador">
          <select
            disabled={disabled}
            value={cfg<string>(node, "op", "gte")}
            onChange={(e) => set({ op: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="eq">igual</option>
            <option value="neq">diferente</option>
            <option value="gt">maior que</option>
            <option value="gte">maior ou igual</option>
            <option value="lt">menor que</option>
            <option value="lte">menor ou igual</option>
            <option value="contains">contém</option>
            <option value="has">tem</option>
          </select>
        </Field>
        <Field label="Valor">
          <input
            disabled={disabled}
            value={cfg<string>(node, "value", "")}
            onChange={(e) => set({ value: e.target.value })}
            placeholder="ex.: 70"
            className={INPUT_CLS}
          />
        </Field>
      </div>
    );
  }

  if (node.tipo === "espera") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Duração">
            <input
              type="number"
              min={1}
              disabled={disabled}
              value={cfg<number>(node, "amount", 1)}
              onChange={(e) => set({ amount: Number(e.target.value) })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Unidade">
            <select
              disabled={disabled}
              value={cfg<string>(node, "unit", "hours")}
              onChange={(e) => set({ unit: e.target.value })}
              className={SELECT_CLS}
            >
              <option value="minutes">minutos</option>
              <option value="hours">horas</option>
              <option value="days">dias</option>
            </select>
          </Field>
        </div>
      </div>
    );
  }

  if (node.tipo === "ia") {
    return (
      <div className="space-y-3">
        <Field label="Modelo">
          <select
            disabled={disabled}
            value={cfg<string>(node, "model", "claude-haiku-4-5-20251001")}
            onChange={(e) => set({ model: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="claude-haiku-4-5-20251001">Haiku 4.5 (rápido, barato)</option>
            <option value="claude-sonnet-4-6">Sonnet 4.6 (balanceado)</option>
            <option value="claude-opus-4-7">Opus 4.7 (máxima qualidade)</option>
          </select>
        </Field>
        <Field label="Prompt">
          <textarea
            disabled={disabled}
            rows={6}
            value={cfg<string>(node, "prompt", "")}
            onChange={(e) => set({ prompt: e.target.value })}
            placeholder={"Classifique o interesse do lead baseado em:\n- nome: {{lead.nome}}\n- mensagem: {{lead.ultima_mensagem}}\n\nResponda só com: alto, medio ou baixo."}
            className={TEXTAREA_CLS}
          />
        </Field>
        <Field label="Saída em variável">
          <input
            disabled={disabled}
            value={cfg<string>(node, "outputVar", "ai_resultado")}
            onChange={(e) => set({ outputVar: e.target.value })}
            placeholder="ai_resultado"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Temperature">
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            disabled={disabled}
            value={cfg<number>(node, "temperature", 0.3)}
            onChange={(e) => set({ temperature: Number(e.target.value) })}
            className={INPUT_CLS}
          />
        </Field>
      </div>
    );
  }

  if (node.tipo === "divisao") {
    return (
      <Field label="Split A (%)">
        <input
          type="number"
          min={0}
          max={100}
          disabled={disabled}
          value={cfg<number>(node, "percentA", 50)}
          onChange={(e) => set({ percentA: Number(e.target.value) })}
          className={INPUT_CLS}
        />
      </Field>
    );
  }

  if (node.tipo === "fim") {
    return (
      <div className="text-[11px] text-slate-500">
        Nó final — encerra o fluxo sem saída.
      </div>
    );
  }

  // acao
  const kind = cfg<string>(node, "kind", "send_whatsapp_text");
  const ACTION_KINDS: Array<[string, string]> = [
    ["send_whatsapp_text", "WhatsApp: mensagem livre"],
    ["send_whatsapp_template", "WhatsApp: template"],
    ["apply_tag", "Aplicar tag"],
    ["remove_tag", "Remover tag"],
    ["change_stage", "Alterar etapa"],
    ["change_status", "Alterar status"],
    ["assign_auto", "Atribuir corretor (auto)"],
    ["assign_manual", "Atribuir corretor (manual)"],
    ["add_note", "Adicionar nota"],
    ["set_field", "Atualizar campo"],
    ["http_request", "HTTP Request"],
    ["set_vars", "Atualizar variáveis"],
  ];

  return (
    <div className="space-y-3">
      <Field label="Tipo de ação">
        <select
          disabled={disabled}
          value={kind}
          onChange={(e) => set({ kind: e.target.value })}
          className={SELECT_CLS}
        >
          {ACTION_KINDS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Field>

      {kind === "send_whatsapp_text" && (
        <Field label="Mensagem">
          <textarea
            disabled={disabled}
            rows={5}
            value={cfg<string>(node, "text", "")}
            onChange={(e) => set({ text: e.target.value })}
            placeholder="Olá {{lead.nome}}, tudo bem? 👋"
            className={TEXTAREA_CLS}
          />
          <div className="text-[10px] text-slate-500 mt-1">
            Use {"{{lead.nome}}"}, {"{{lead.score}}"}, {"{{ai_resultado}}"} etc.
          </div>
        </Field>
      )}

      {kind === "send_whatsapp_template" && (
        <>
          <Field label="Template">
            <input
              disabled={disabled}
              value={cfg<string>(node, "template", "")}
              onChange={(e) => set({ template: e.target.value })}
              placeholder="boas_vindas_v1"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Parâmetros (JSON)">
            <textarea
              disabled={disabled}
              rows={3}
              value={cfg<string>(node, "paramsJson", "{}")}
              onChange={(e) => set({ paramsJson: e.target.value })}
              placeholder='{"1": "{{lead.nome}}"}'
              className={TEXTAREA_CLS}
            />
          </Field>
        </>
      )}

      {(kind === "apply_tag" || kind === "remove_tag") && (
        <Field label="Tag">
          <input
            disabled={disabled}
            value={cfg<string>(node, "tag", "")}
            onChange={(e) => set({ tag: e.target.value })}
            placeholder="ex.: quente"
            className={INPUT_CLS}
          />
        </Field>
      )}

      {kind === "change_stage" && (
        <Field label="Etapa alvo">
          <input
            disabled={disabled}
            value={cfg<string>(node, "stage", "")}
            onChange={(e) => set({ stage: e.target.value })}
            placeholder="ex.: contato_feito"
            className={INPUT_CLS}
          />
        </Field>
      )}

      {kind === "change_status" && (
        <Field label="Status">
          <select
            disabled={disabled}
            value={cfg<string>(node, "status", "ativo")}
            onChange={(e) => set({ status: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="ativo">ativo</option>
            <option value="qualificado">qualificado</option>
            <option value="ganho">ganho</option>
            <option value="perdido">perdido</option>
            <option value="pausado">pausado</option>
          </select>
        </Field>
      )}

      {kind === "assign_auto" && (
        <Field label="Política">
          <select
            disabled={disabled}
            value={cfg<string>(node, "policy", "roundrobin")}
            onChange={(e) => set({ policy: e.target.value })}
            className={SELECT_CLS}
          >
            <option value="roundrobin">Round-robin</option>
            <option value="least-busy">Menos ocupado</option>
            <option value="top-score">Melhor vendedor</option>
          </select>
        </Field>
      )}

      {kind === "assign_manual" && (
        <Field label="Usuário (id)">
          <input
            disabled={disabled}
            value={cfg<string>(node, "userId", "")}
            onChange={(e) => set({ userId: e.target.value })}
            placeholder="uuid do corretor"
            className={INPUT_CLS}
          />
        </Field>
      )}

      {kind === "add_note" && (
        <Field label="Nota">
          <textarea
            disabled={disabled}
            rows={4}
            value={cfg<string>(node, "note", "")}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="Fluxo X disparado em {{now}}"
            className={TEXTAREA_CLS}
          />
        </Field>
      )}

      {kind === "set_field" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Campo">
            <input
              disabled={disabled}
              value={cfg<string>(node, "field", "")}
              onChange={(e) => set({ field: e.target.value })}
              placeholder="score"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Valor">
            <input
              disabled={disabled}
              value={cfg<string>(node, "value", "")}
              onChange={(e) => set({ value: e.target.value })}
              placeholder="70"
              className={INPUT_CLS}
            />
          </Field>
        </div>
      )}

      {kind === "http_request" && (
        <div className="space-y-2">
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <Field label="Método">
              <select
                disabled={disabled}
                value={cfg<string>(node, "method", "GET")}
                onChange={(e) => set({ method: e.target.value })}
                className={SELECT_CLS}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </Field>
            <Field label="URL">
              <input
                disabled={disabled}
                value={cfg<string>(node, "url", "")}
                onChange={(e) => set({ url: e.target.value })}
                placeholder="https://api.exemplo.com/leads/{{lead.id}}"
                className={INPUT_CLS}
              />
            </Field>
          </div>
          <Field label="Headers (JSON)">
            <textarea
              disabled={disabled}
              rows={2}
              value={cfg<string>(node, "headersJson", "{}")}
              onChange={(e) => {
                const raw = e.target.value;
                try {
                  const parsed = JSON.parse(raw);
                  set({ headersJson: raw, headers: parsed });
                } catch {
                  set({ headersJson: raw });
                }
              }}
              placeholder='{"authorization": "Bearer ..."}'
              className={TEXTAREA_CLS}
            />
          </Field>
          <Field label="Body (texto ou JSON)">
            <textarea
              disabled={disabled}
              rows={4}
              value={cfg<string>(node, "bodyText", "")}
              onChange={(e) => set({ bodyText: e.target.value, body: e.target.value })}
              placeholder='{"nome": "{{lead.nome}}", "score": {{lead.score}}}'
              className={TEXTAREA_CLS}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Guardar em">
              <input
                disabled={disabled}
                value={cfg<string>(node, "outputVar", "http_response")}
                onChange={(e) => set({ outputVar: e.target.value })}
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Timeout (ms)">
              <input
                disabled={disabled}
                type="number"
                min={500}
                max={30000}
                value={cfg<number>(node, "timeoutMs", 10000)}
                onChange={(e) => set({ timeoutMs: Number(e.target.value) })}
                className={INPUT_CLS}
              />
            </Field>
          </div>
        </div>
      )}

      {kind === "set_vars" && (
        <Field label="Variáveis (JSON {nome: template})">
          <textarea
            disabled={disabled}
            rows={5}
            value={cfg<string>(node, "varsJson", "{}")}
            onChange={(e) => {
              const raw = e.target.value;
              try {
                const parsed = JSON.parse(raw);
                set({ varsJson: raw, vars: parsed });
              } catch {
                set({ varsJson: raw });
              }
            }}
            placeholder='{"saudacao": "Olá {{lead.nome}}", "hora": "{{now.time}}"}'
            className={TEXTAREA_CLS}
          />
          <div className="text-[10px] text-slate-500 mt-1">
            Cada valor é renderizado como template e armazenado em <code>vars.*</code>.
          </div>
        </Field>
      )}
    </div>
  );
}

export { KIND_META as FLOW_KIND_META };
