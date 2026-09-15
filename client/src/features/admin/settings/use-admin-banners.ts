import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { AdminBanner, AdminBannersResponse, UpdateBannerBody } from "./types";
import {
  deleteAdminBanner,
  getAdminBanners,
  reorderAdminBanners,
  updateAdminBanner,
  uploadAdminBanners,
} from "./api";

const DEFAULT_LIMIT = 8;

function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

// Everything the Home banners page does. Every change goes to the server,
// which answers with the full, freshly ordered list - so the page always
// shows exactly what the app will.
export function useAdminBanners() {
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // Banner currently being saved, so only its row shows as busy.
  const [busyId, setBusyId] = useState<string | null>(null);

  const apply = (response: AdminBannersResponse) => {
    setItems(response.items ?? []);
    setLimit(response.limit ?? DEFAULT_LIMIT);
  };

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      apply(await getAdminBanners());
    } catch (error) {
      toast.error(`Couldn't load banners: ${message(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = async (files: File[]) => {
    if (!files.length) return false;
    try {
      setUploading(true);
      apply(await uploadAdminBanners(files));
      toast.success(files.length === 1 ? "Banner added" : `${files.length} banners added`);
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    } finally {
      setUploading(false);
    }
  };

  const update = async (banner: AdminBanner, body: UpdateBannerBody, done?: string) => {
    try {
      setBusyId(banner._id);
      apply(await updateAdminBanner(banner._id, body));
      if (done) toast.success(done);
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = (banner: AdminBanner) =>
    update(
      banner,
      { isActive: !banner.isActive },
      banner.isActive ? "Banner hidden from the app" : "Banner shown in the app",
    );

  // Move one place up (-1) or down (+1). The list moves at once; if the server
  // refuses, the previous order comes back.
  const move = async (banner: AdminBanner, step: -1 | 1) => {
    const from = items.findIndex((b) => b._id === banner._id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= items.length) return;

    const previous = items;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);

    try {
      setBusyId(banner._id);
      apply(await reorderAdminBanners(next.map((b) => b._id)));
    } catch (error) {
      setItems(previous);
      toast.error(message(error));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (banner: AdminBanner) => {
    try {
      setBusyId(banner._id);
      apply(await deleteAdminBanner(banner._id));
      toast.success("Banner deleted");
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { items, limit, loading, uploading, busyId, refresh, upload, update, toggleActive, move, remove };
}
