"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthError, describeApiError } from "./errors";
import { redirectToLogin } from "./auth";
import type { PageParams, PageResponse } from "@/lib/types/api";

interface ListSnapshot<T> {
  /** The page this snapshot was fetched for. */
  page: number;
  /** The reload generation this snapshot was fetched for. */
  reloadKey: number;
  result: PageResponse<T> | null;
  error: string | null;
}

export interface AdminListState<T> {
  result: PageResponse<T> | null;
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  /** Refetch the current page (call after every mutation). */
  reload: () => void;
}

/**
 * Shared client-side list loader for admin tables:
 * - fetches `fetcher({ page, page_size })` whenever page/reload changes;
 * - bounces to /admin/login on 401;
 * - surfaces other failures as a message;
 * - steps back a page when a mutation empties the current one.
 *
 * Loading is derived from snapshot staleness (no synchronous setState inside
 * the effect), keeping renders predictable.
 */
export function useAdminList<T>(
  fetcher: (params: PageParams) => Promise<PageResponse<T>>,
  pageSize: number,
): AdminListState<T> {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [snapshot, setSnapshot] = useState<ListSnapshot<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetcher({ page, page_size: pageSize })
      .then((res) => {
        if (cancelled) return;
        if (res.items.length === 0 && res.page > 1) {
          // The last item on this page was deleted — step back one page.
          setPage(res.page - 1);
          return;
        }
        setSnapshot({ page, reloadKey, result: res, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        setSnapshot({
          page,
          reloadKey,
          result: null,
          error: describeApiError(err, "列表加载失败，请重试"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, page, pageSize, reloadKey, router]);

  const loading =
    snapshot === null ||
    snapshot.page !== page ||
    snapshot.reloadKey !== reloadKey;

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return {
    result: loading ? null : snapshot?.result ?? null,
    loading,
    error: loading ? null : snapshot?.error ?? null,
    page,
    setPage,
    reload,
  };
}
