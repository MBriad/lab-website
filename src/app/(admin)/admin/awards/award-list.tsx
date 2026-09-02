"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import {
  AWARD_CATEGORY_LABELS,
  LevelBadge,
} from "@/components/ui/badges";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { Button, ButtonLink } from "@/components/admin/ui/button";
import { AdminBadge } from "@/components/admin/ui/badge";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminSkeletonRows } from "@/components/admin/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import { Pager } from "@/components/admin/ui/pager";
import { Table, Td, Th } from "@/components/admin/ui/table";
import { useAdminList } from "@/components/admin/lib/use-admin-list";
import {
  describeApiError,
  isAuthError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import type { AwardAdmin } from "@/lib/types/api";

const PAGE_SIZE = 20;

export function AwardList() {
  const router = useRouter();
  // Pass the stable `api` method reference (see news-list for why).
  const list = useAdminList<AwardAdmin>(api.listAdminAwards, PAGE_SIZE);
  const { notice, show, dismiss } = useNotice();
  const [deleteTarget, setDeleteTarget] = useState<AwardAdmin | null>(null);
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

  const handleToggleVisible = (item: AwardAdmin) =>
    runMutation(
      item.id,
      () => api.updateAward(item.id, { is_visible: !item.is_visible }),
      item.is_visible ? "已隐藏。" : "已显示。",
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await runMutation(
      target.id,
      () => api.deleteAward(target.id),
      `已删除「${target.title}」。`,
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        tag="SEC.05 // AWARDS"
        title="荣誉管理"
        description="创建、编辑奖项，设置类别、级别、年份与精选状态。"
        actions={
          <ButtonLink href="/admin/awards/new" variant="primary">
            新建荣誉
          </ButtonLink>
        }
      />

      <Notice notice={notice} onClose={dismiss} />

      {list.loading ? (
        <AdminSkeletonRows rows={6} />
      ) : list.error ? (
        <ErrorNote title="荣誉列表加载失败" message={list.error} />
      ) : !list.result || list.result.items.length === 0 ? (
        <EmptyState title="暂无荣誉" hint="点击「新建荣誉」添加第一个奖项。" />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>标题</Th>
                <Th>类别 / 级别</Th>
                <Th>年份</Th>
                <Th>状态</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {list.result.items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <Link
                      href={`/admin/awards/${item.id}`}
                      className="font-medium text-ink transition-colors hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">
                      {item.competition_name}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-faint">
                        {AWARD_CATEGORY_LABELS[item.category]}
                      </span>
                      <LevelBadge level={item.level} />
                    </div>
                  </Td>
                  <Td className="font-mono text-ink-muted">{item.year}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      {item.is_featured ? (
                        <AdminBadge tone="accent">精选</AdminBadge>
                      ) : null}
                      {item.is_visible ? (
                        <AdminBadge tone="success">显示</AdminBadge>
                      ) : (
                        <AdminBadge tone="warning">隐藏</AdminBadge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busyId === item.id}
                        onClick={() => handleToggleVisible(item)}
                      >
                        {item.is_visible ? "隐藏" : "显示"}
                      </Button>
                      <ButtonLink
                        href={`/admin/awards/${item.id}`}
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
        title="删除荣誉"
        message={`确定删除「${deleteTarget?.title ?? ""}」吗？该操作无法撤销。`}
        confirmLabel="删除"
        busy={busyId !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
