'use client';

import { useState } from 'react';
import type { StoredTemplate, TemplateKind, TemplatesResponse } from '@/lib/admin/types';
import { useAdminResource } from './useAdminResource';
import CategoriesManager from './CategoriesManager';
import FeedbackPanel from './FeedbackPanel';
import CourseCompletionsPanel from './CourseCompletionsPanel';

import {
  Dialog,
  Empty,
  ErrorState,
  Note,
  Panel,
  SectionTitle,
  Skeleton,
  Tag,
  num,
  when,
} from './ui';

type TabId = TemplateKind | 'tags' | 'feedback' | 'completions';

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'cover_letter', label: 'Cover letters', blurb: 'Niche letters offered in the builder.' },
  { id: 'resume', label: 'Resumes', blurb: 'Layouts the exporter can render.' },
  { id: 'tags', label: 'Categories & tags', blurb: 'Skills attached to indexed listings.' },
  { id: 'feedback', label: 'Course feedback', blurb: 'What readers said about each lesson.' },
  { id: 'completions', label: 'Completions', blurb: 'Who finished a course, and the stars they left.' },
];

type Draft = { id: string | null; kind: TemplateKind; name: string; slug: string; body: string };

export default function ContentSection() {
  const { data, error, loading, refreshing, reload } = useAdminResource<TemplatesResponse>('/api/admin/templates');
  const [tab, setTab] = useState<TabId>('cover_letter');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<StoredTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const active = TABS.find((entry) => entry.id === tab)!;
  const kind: TemplateKind = tab === 'tags' || tab === 'feedback' || tab === 'completions' ? 'cover_letter' : tab;
  const builtins = data?.builtins.filter((entry) => entry.kind === kind) ?? [];
  const stored = data?.stored.filter((entry) => entry.kind === kind) ?? [];
  const editable = Boolean(data?.editable);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        kind: draft.kind,
        label: draft.name,
        blurb: draft.slug,
        body: draft.body,
      };
      const response = await fetch(
        draft.id ? `/api/admin/templates/${draft.id}` : '/api/admin/templates',
        {
          method: draft.id ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? `Failed with ${response.status}.`);
      setDraft(null);
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/admin/templates/${deleting.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok && response.status !== 204) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? `Failed with ${response.status}.`);
      }
      setDeleting(null);
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not delete.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-fade space-y-5">
      <SectionTitle
        index="05 / Content"
        title="Templates and tags"
        sub="Built-in templates ship with the app and are edited in code. Anything added here is stored in the database and layered on top."
      />

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="ad-btn"
            data-variant={tab === entry.id ? 'primary' : undefined}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
        {tab === 'feedback' || tab === 'completions' ? null : (
          <button type="button" className="ad-btn ml-auto" onClick={reload} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      </div>

      {tab === 'feedback' ? <FeedbackPanel /> : null}
      {tab === 'completions' ? <CourseCompletionsPanel /> : null}

      {tab !== 'feedback' && tab !== 'completions' && error ? <ErrorState message={error} onRetry={reload} /> : null}

      {tab !== 'feedback' && tab !== 'completions' && loading && !data ? (
        <div className="ad-panel p-5">
          <Skeleton rows={4} />
        </div>
      ) : null}

      {tab !== 'feedback' && tab !== 'completions' && data ? (
        <>
          {!editable ? (
            <Note tone="warn">
              <p className="font-semibold" style={{ color: 'var(--ad-warn)' }}>
                Custom templates are read-only right now
              </p>
              <p className="mt-1">
                There is nowhere to save them. The <code className="ad-mono">admin_templates</code> table does not
                exist yet, so add, edit and delete are switched off. Apply{' '}
                <code className="ad-mono">src/app/api/admin/schema.sql</code> and they light up. The built-in
                templates keep working either way.
              </p>
            </Note>
          ) : null}

          {tab === 'tags' ? (
            <div className="space-y-5">
            <CategoriesManager />
            <Panel
              title="Live tags from the jobs table"
              hint="Real counts across indexed listings. Useful for deciding which categories are worth featuring."
            >
              {data.tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.map((row) => (
                    <span key={row.tag} className="ad-tag">
                      {row.tag}
                      <span className="ad-num" style={{ color: 'var(--color-faint)' }}>
                        {num(row.jobs)}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <Empty>No skills recorded on any job.</Empty>
              )}
            </Panel>
            </div>
          ) : (
            <>
              <Panel title={`Built-in ${active.label.toLowerCase()}`} hint={active.blurb} flush>
                {builtins.length ? (
                  <div className="ad-scroll">
                    <table className="ad-table ad-stack">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>What it does</th>
                          <th className="ad-right">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {builtins.map((entry) => (
                          <tr key={entry.id}>
                            <td className="font-semibold" data-label="Name" style={{ color: 'var(--color-ink)' }}>
                              {entry.label}
                            </td>
                            <td data-label="What it does">{entry.blurb}</td>
                            <td className="ad-right" data-label="Source">
                              <Tag>In code</Tag>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>Nothing built in for this type.</Empty>
                )}
              </Panel>

              <Panel
                title={`Custom ${active.label.toLowerCase()}`}
                hint="Stored in the database. Editable here."
                action={
                  <button
                    type="button"
                    className="ad-btn"
                    data-variant="primary"
                    disabled={!editable}
                    title={editable ? undefined : 'Create the admin_templates table first'}
                    onClick={() => {
                      setFormError(null);
                      setDraft({ id: null, kind, name: '', slug: '', body: '' });
                    }}
                  >
                    Add new
                  </button>
                }
                flush
              >
                {stored.length ? (
                  <div className="ad-scroll">
                    <table className="ad-table ad-stack">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th className="ad-right">Updated</th>
                          <th className="ad-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stored.map((entry) => (
                          <tr key={entry.id}>
                            <td className="font-semibold" data-label="Name" style={{ color: 'var(--color-ink)' }}>
                              {entry.name}
                            </td>
                            <td className="ad-mono" data-label="Description">{entry.slug}</td>
                            <td className="ad-right" data-label="Updated">
                              {when(entry.updatedAt)}
                              {entry.updatedBy ? (
                                <span className="block text-xs" style={{ color: 'var(--color-faint)' }}>
                                  {entry.updatedBy}
                                </span>
                              ) : null}
                            </td>
                            <td className="ad-right" data-label="Actions">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="ad-btn"
                                  onClick={() => {
                                    setFormError(null);
                                    setDraft({
                                      id: entry.id,
                                      kind: entry.kind,
                                      name: entry.name,
                                      slug: entry.slug,
                                      body: entry.body,
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="ad-btn"
                                  data-variant="danger"
                                  onClick={() => {
                                    setFormError(null);
                                    setDeleting(entry);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>Nothing custom yet.</Empty>
                )}
              </Panel>
            </>
          )}
        </>
      ) : null}

      <Dialog
        open={Boolean(draft)}
        title={draft?.id ? 'Edit template' : 'New template'}
        onClose={() => setDraft(null)}
        footer={
          <>
            <button type="button" className="ad-btn" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="ad-btn"
              data-variant="primary"
              onClick={save}
              disabled={busy || !draft?.name.trim() || !draft?.body.trim()}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {draft ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div>
              <label className="ad-micro" htmlFor="tpl-name">
                Name
              </label>
              <input
                id="tpl-name"
                className="ad-input mt-1.5"
                value={draft.name}
                autoFocus
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="e.g. Bookkeeper"
              />
            </div>
            <div>
              <label className="ad-micro" htmlFor="tpl-slug">
                Short description
              </label>
              <input
                id="tpl-slug"
                className="ad-input mt-1.5"
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                placeholder="One line shown below the template name"
              />

            </div>
            <div>
              <label className="ad-micro" htmlFor="tpl-body">
                Body
              </label>
              <textarea
                id="tpl-body"
                className="ad-textarea mt-1.5"
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                placeholder={'Use {{name}}, {{role}}, {{company}} and {{contact}} as placeholders.'}
              />
              <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                Placeholders are filled in by the builder at generation time.
              </p>
            </div>
            {formError ? <ErrorState message={formError} /> : null}
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        title="Delete this template?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button type="button" className="ad-btn" onClick={() => setDeleting(null)} disabled={busy}>
              Keep it
            </button>
            <button type="button" className="ad-btn" data-variant="danger" onClick={remove} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          <strong>{deleting?.name}</strong> will be removed for everyone. This cannot be undone, and letters
          already generated from it are not affected.
        </p>
        {formError ? (
          <div className="mt-3">
            <ErrorState message={formError} />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
