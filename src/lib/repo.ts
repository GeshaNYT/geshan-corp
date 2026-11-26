// Хранилище данных. Два режима:
//  • Supabase — настоящая база, изменения видят все;
//  • Демо — данные в браузере (localStorage), чтобы можно было попробовать админку до подключения базы.
import { SEED_FILES, SEED_NODES } from "@/data/seed";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { NodeFile, NodeInput, NodeVersion, SiteNode } from "./types";

export interface Snapshot {
  nodes: SiteNode[];
  files: NodeFile[];
  versions?: NodeVersion[];
}

export interface UploadResult {
  url: string;
  storage_path: string | null;
  size: number;
}

export interface Repo {
  mode: "supabase" | "demo";
  load(): Promise<Snapshot>;
  saveNode(input: NodeInput): Promise<SiteNode>;
  deleteNode(id: string): Promise<void>;
  /** Массовое обновление родителя и порядка (перетаскивание, перенос) */
  reorder(items: { id: string; parent_id: string | null; sort: number }[]): Promise<void>;
  saveFile(file: Partial<NodeFile> & { node_id: string; url: string }): Promise<NodeFile>;
  deleteFile(file: NodeFile): Promise<void>;
  upload(nodeId: string, file: File): Promise<UploadResult>;
  countDownload(fileId: string): Promise<void>;
  importSeed(): Promise<number>;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const now = () => new Date().toISOString();

/* ───────────── Демо-режим ───────────── */

const KEY = "geshan:demo:v1";

function readDemo(): Snapshot {
  if (typeof window === "undefined") return { nodes: SEED_NODES, files: SEED_FILES };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {
    /* повреждённые данные — начинаем заново */
  }
  return { nodes: structuredClone(SEED_NODES), files: structuredClone(SEED_FILES) };
}

function writeDemo(s: Snapshot) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    throw new Error(
      "Не хватает места в браузере. В демо-режиме можно загружать только небольшие файлы.",
    );
  }
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const demoRepo: Repo = {
  mode: "demo",
  async load() {
    return readDemo();
  },
  async saveNode(input) {
    const s = readDemo();
    const existing = input.id ? s.nodes.find((n) => n.id === input.id) : undefined;
    if (s.nodes.some((n) => n.slug === input.slug && n.id !== input.id)) {
      throw new Error(`Адрес «${input.slug}» уже занят другим проектом`);
    }
    const node: SiteNode = existing
      ? { ...existing, ...input, id: existing.id, updated_at: now() }
      : { ...input, id: uid(), created_at: now(), updated_at: now() };
    s.nodes = existing ? s.nodes.map((n) => (n.id === node.id ? node : n)) : [...s.nodes, node];
    writeDemo(s);
    return node;
  },
  async deleteNode(id) {
    const s = readDemo();
    const drop = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of s.nodes)
        if (n.parent_id && drop.has(n.parent_id) && !drop.has(n.id)) {
          drop.add(n.id);
          grew = true;
        }
    }
    s.nodes = s.nodes.filter((n) => !drop.has(n.id));
    s.files = s.files.filter((f) => !drop.has(f.node_id));
    writeDemo(s);
  },
  async reorder(items) {
    const s = readDemo();
    const map = new Map(items.map((i) => [i.id, i]));
    s.nodes = s.nodes.map((n) => (map.has(n.id) ? { ...n, ...map.get(n.id)! } : n));
    writeDemo(s);
  },
  async saveFile(file) {
    const s = readDemo();
    const existing = file.id ? s.files.find((f) => f.id === file.id) : undefined;
    const full: NodeFile = {
      label: "",
      version: "",
      platform: "",
      storage_path: null,
      size: null,
      downloads: 0,
      sort: s.files.filter((f) => f.node_id === file.node_id).length,
      created_at: now(),
      ...existing,
      ...file,
      id: existing?.id ?? uid(),
    } as NodeFile;
    s.files = existing ? s.files.map((f) => (f.id === full.id ? full : f)) : [...s.files, full];
    writeDemo(s);
    return full;
  },
  async deleteFile(file) {
    const s = readDemo();
    s.files = s.files.filter((f) => f.id !== file.id);
    writeDemo(s);
  },
  async upload(_nodeId, file) {
    if (file.size > 1.5 * 1024 * 1024) {
      throw new Error(
        "В демо-режиме можно загрузить файл до 1,5 МБ. Подключи Supabase, чтобы загружать большие файлы.",
      );
    }
    const url = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    return { url, storage_path: null, size: file.size };
  },
  async countDownload(fileId) {
    const s = readDemo();
    s.files = s.files.map((f) => (f.id === fileId ? { ...f, downloads: f.downloads + 1 } : f));
    writeDemo(s);
  },
  async importSeed() {
    resetDemo();
    return SEED_NODES.length;
  },
};

/* ───────────── Supabase ───────────── */

function sb() {
  if (!supabase) throw new Error("Supabase не настроен");
  return supabase;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const supabaseRepo: Repo = {
  mode: "supabase",
  async load() {
    const [nodes, files, versions] = await Promise.all([
      sb().from("nodes").select("*").order("sort"),
      sb().from("node_files").select("*").order("sort"),
      sb().from("node_versions").select("*").order("sort"),
    ]);
    return {
      nodes: check(nodes) as SiteNode[],
      files: check(files) as NodeFile[],
      // если таблицы версий ещё нет — просто без версий
      versions: versions.error ? [] : (versions.data as NodeVersion[]),
    };
  },
  async saveNode(input) {
    const { id, ...rest } = input;
    const row = { ...rest, updated_at: now() };
    const res = id
      ? await sb().from("nodes").update(row).eq("id", id).select().single()
      : await sb().from("nodes").insert(row).select().single();
    if (res.error?.code === "23505")
      throw new Error(`Адрес «${input.slug}» уже занят другим проектом`);
    return check(res) as SiteNode;
  },
  async deleteNode(id) {
    // Файлы из хранилища удаляем вместе с проектом и всеми вложенными
    const { nodes, files } = await this.load();
    const drop = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of nodes)
        if (n.parent_id && drop.has(n.parent_id) && !drop.has(n.id)) {
          drop.add(n.id);
          grew = true;
        }
    }
    const paths = files
      .filter((f) => drop.has(f.node_id) && f.storage_path)
      .map((f) => f.storage_path!);
    if (paths.length) await sb().storage.from("resources").remove(paths);
    check(await sb().from("nodes").delete().eq("id", id));
  },
  async reorder(items) {
    await Promise.all(
      items.map(async (i) =>
        check(
          await sb().from("nodes").update({ parent_id: i.parent_id, sort: i.sort }).eq("id", i.id),
        ),
      ),
    );
  },
  async saveFile(file) {
    const { id, ...rest } = file;
    const res = id
      ? await sb().from("node_files").update(rest).eq("id", id).select().single()
      : await sb().from("node_files").insert(rest).select().single();
    return check(res) as NodeFile;
  },
  async deleteFile(file) {
    if (file.storage_path) await sb().storage.from("resources").remove([file.storage_path]);
    check(await sb().from("node_files").delete().eq("id", file.id));
  },
  async upload(nodeId, file) {
    const safe = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${nodeId}/${Date.now()}-${safe}`;
    check(
      await sb()
        .storage.from("resources")
        .upload(path, file, { upsert: false, contentType: file.type || undefined }),
    );
    const { data } = sb().storage.from("resources").getPublicUrl(path);
    return { url: data.publicUrl, storage_path: path, size: file.size };
  },
  async countDownload(fileId) {
    await sb().rpc("count_download", { file_id: fileId });
  },
  async importSeed() {
    // Переносим стартовое содержимое в базу, сохраняя иерархию
    const idMap = new Map<string, string>();
    for (const n of SEED_NODES) idMap.set(n.id, uid());
    const rows = SEED_NODES.map(({ id, parent_id, created_at: _c, updated_at: _u, ...rest }) => ({
      ...rest,
      id: idMap.get(id),
      parent_id: parent_id ? idMap.get(parent_id) : null,
    }));
    // Родители должны вставиться раньше детей — SEED_NODES уже в таком порядке
    check(await sb().from("nodes").insert(rows));
    return rows.length;
  },
};

export const repo: Repo = isSupabaseConfigured ? supabaseRepo : demoRepo;

/* ───────────── Версии ───────────── */

export const versionsApi = {
  async save(v: Partial<NodeVersion> & { node_id: string; version: string }) {
    const { id, created_at: _c, ...rest } = v;
    const row = {
      ...rest,
      version: rest.version.trim(),
      url: (rest.url ?? "").trim(),
      notes: (rest.notes ?? "").trim(),
      released_at: rest.released_at || null,
      released_ts: rest.released_ts || null,
    };
    const res = id
      ? await sb().from("node_versions").update(row).eq("id", id)
      : await sb().from("node_versions").insert(row);
    check(res);
  },
  async remove(id: string) {
    check(await sb().from("node_versions").delete().eq("id", id));
  },
  async reorder(list: { id: string }[]) {
    await Promise.all(
      list.map(async (v, i) =>
        check(await sb().from("node_versions").update({ sort: i }).eq("id", v.id)),
      ),
    );
  },
};
