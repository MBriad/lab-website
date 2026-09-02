"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { Button, ButtonLink } from "@/components/admin/ui/button";
import { AdminBadge } from "@/components/admin/ui/badge";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminSkeletonRows } from "@/components/admin/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import { Pager } from "@/components/admin/ui/pager";
import { Switch } from "@/components/admin/ui/switch";
import { Table, Td, Th } from "@/components/admin/ui/table";
import { useAdminList } from "@/components/admin/lib/use-admin-list";
import {
  describeApiError,
  isAuthError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import type { ResearchAreaAdmin } from "@/lib/types/api";

const PAGE_SIZE = 50;

export function ResearchList() {
  const router = useRouter();
  // Pass the stable `api` method reference (see news-list for why).
  const list = useAdminList<ResearchAreaAdmin>(
    api.listAdminResearchAreas,
    PAGE_SIZE,
  );
  const { notice, show, dismiss } = useNotice();
  const [deleteTarget, setDeleteTarget] = useState<ResearchAreaAdmin | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runMutation = useCallback(
    async (id: string, action: () => Promise<unknown>, okMessage: string) => {
      setBusyId(id);
      try {
        await action();
        show("success", okMessage);
        list.reload();
      } catch (err) {
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        show("error", describeApiError(err, "操作失败，请重试"));
      } finally {
        setBusyId(null);
      }
    },
    [list, show, router],
  );

  const handleToggleVisible = (item: ResearchAreaAdmin) =>
    runMutation(
      item.id,
      () => api.updateResearchArea(item.id, { is_visible: !item.is_visible }),
      item.is_visible ? "已隐藏。" : "已显示。",
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await runMutation(
      target.id,
      () => api.deleteResearchArea(target.id),
      `已删除「${target.title}」。`,
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        tag="SEC.04 // RESEARCH"
        title="研究方向管理"
        description="增删研究方向，用排序值控制顺序，并可临时隐藏。"
        actions={
          <ButtonLink href="/admin/research/new" variant="primary">
            新建研究方向
          </ButtonLink>
        }
      />

      <Notice notice={notice} onClose={dismiss} />

      {list.loading ? (
        <AdminSkeletonRows rows={5} />
      ) : list.error ? (
        <ErrorNote title="研究方向加载失败" message={list.error} />
      ) : !list.result || list.result.items.length === 0 ? (
        <EmptyState title="暂无研究方向" hint="点击「新建研究方向」添加。" />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>标题</Th>
                <Th>状态</Th>
                <Th>排序</Th>
                <Th>前台显示</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {list.result.items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <Link
                      href={`/admin/research/${item.id}`}
                      className="font-medium text-ink transition-colors hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      /{item.slug}
                    </p>
                  </Td>
                  <Td>
                    {item.is_visible ? (
                      <AdminBadge tone="success">显示</AdminBadge>
                    ) : (
                      <AdminBadge tone="warning">隐藏</AdminBadge>
                    )}
                  </Td>
                  <Td className="font-mono text-ink-muted">{item.sort_order}</Td>
                  <Td>
                    <Switch
                      checked={item.is_visible}
                      disabled={busyId === item.id}
                      onCheckedChange={() => handleToggleVisible(item)}
                      label={item.is_visible ? "显示中" : "已隐藏"}
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <ButtonLink
                        href={`/admin/research/${item.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        编辑
                      </ButtonLink>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                      >
                        删除
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pager
            page={list.result.page}
            pages={list.result.pages}
            onPage={list.setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除研究方向"
        message={`确定删除「${deleteTarget?.title ?? ""}」吗？该操作无法撤销。`}
        confirmLabel="删除"
        busy={busyId !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
