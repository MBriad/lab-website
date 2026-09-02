"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
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
import { formatDate } from "@/lib/format";
import type { ProjectAdmin } from "@/lib/types/api";

const PAGE_SIZE = 20;

export function ProjectList() {
  const router = useRouter();
  // Pass the stable `api` method reference (see news-list for why).
  const list = useAdminList<ProjectAdmin>(api.listAdminProjects, PAGE_SIZE);
  const { notice, show, dismiss } = useNotice();
  const [deleteTarget, setDeleteTarget] = useState<ProjectAdmin | null>(null);
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

  const handlePublish = (item: ProjectAdmin) =>
    runMutation(
      item.id,
      () => api.publishProject(item.id),
      "已发布，前台可见。",
    );

  const handleToggleVisible = (item: ProjectAdmin) =>
    runMutation(
      item.id,
      () => api.updateProject(item.id, { is_visible: !item.is_visible }),
      item.is_visible ? "已隐藏，前台不再展示。" : "已显示，发布内容可在前台展示。",
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await runMutation(
      target.id,
      () => api.deleteProject(target.id),
      `已删除「${target.title}」。`,
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        tag="SEC.03 // PROJECTS"
        title="项目管理"
        description="创建、编辑、发布项目，并用排序值控制前台顺序。"
        actions={
          <ButtonLink href="/admin/projects/new" variant="primary">
            新建项目
          </ButtonLink>
        }
      />

      <Notice notice={notice} onClose={dismiss} />

      {list.loading ? (
        <AdminSkeletonRows rows={6} />
      ) : list.error ? (
        <ErrorNote title="项目列表加载失败" message={list.error} />
      ) : !list.result || list.result.items.length === 0 ? (
        <EmptyState title="暂无项目" hint="点击「新建项目」创建第一个草稿。" />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>封面</Th>
                <Th>标题</Th>
                <Th>状态</Th>
                <Th>排序</Th>
                <Th>更新时间</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {list.result.items.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <MediaImage
                      media={item.cover}
                      alt={item.title}
                      mode="cover"
                      className="h-10 w-16 rounded-hud border border-hairline"
                      sizes="64px"
                    />
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/projects/${item.id}`}
                      className="font-medium text-ink transition-colors hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                      /{item.slug}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      {item.published_at ? (
                        <AdminBadge tone="success">已发布</AdminBadge>
                      ) : (
                        <AdminBadge tone="neutral">草稿</AdminBadge>
                      )}
                      {!item.is_visible ? (
                        <AdminBadge tone="warning">隐藏</AdminBadge>
                      ) : null}
                    </div>
                  </Td>
                  <Td className="font-mono text-ink-muted">{item.sort_order}</Td>
                  <Td className="whitespace-nowrap text-ink-muted">
                    {formatDate(item.updated_at)}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {!item.published_at ? (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={busyId === item.id}
                          onClick={() => handlePublish(item)}
                        >
                          发布
                        </Button>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busyId === item.id}
                        onClick={() => handleToggleVisible(item)}
                      >
                        {item.is_visible ? "隐藏" : "显示"}
                      </Button>
                      <ButtonLink
                        href={`/admin/projects/${item.id}`}
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
        title="删除项目"
        message={`确定删除「${deleteTarget?.title ?? ""}」吗？该操作无法撤销。`}
        confirmLabel="删除"
        busy={busyId !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
