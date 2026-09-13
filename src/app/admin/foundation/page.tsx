"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  adminApi,
  type FoundationClinicCard,
  type FoundationImpactFigures,
  type FoundationInquiryKind,
  type FoundationInquiryRow,
} from "@/lib/admin-api";

const KIND_LABEL: Record<FoundationInquiryKind, string> = {
  SCHOOL: "School visit",
  VOLUNTEER: "Volunteer",
  FACILITY: "Facility",
  CONTACT: "Contact",
};

const KIND_CLASS: Record<FoundationInquiryKind, string> = {
  SCHOOL: "bg-sky-500/20 text-sky-300",
  VOLUNTEER: "bg-emerald-500/20 text-emerald-300",
  FACILITY: "bg-amber-500/20 text-amber-300",
  CONTACT: "bg-violet-500/20 text-violet-300",
};

export default function FoundationSitePage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [kind, setKind] = useState<string>("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const photo = useQuery({
    queryKey: ["admin", "foundation", "founder-photo"],
    queryFn: () => adminApi.getFounderPhoto(),
  });

  const upload = useMutation({
    mutationFn: (file: File) => adminApi.uploadFounderPhoto(file),
    onSuccess: () => {
      setLocalPreview(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "foundation", "founder-photo"],
      });
    },
  });

  const remove = useMutation({
    mutationFn: () => adminApi.removeFounderPhoto(),
    onSuccess: () => {
      setLocalPreview(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "foundation", "founder-photo"],
      });
    },
  });

  const inquiries = useQuery({
    queryKey: ["admin", "foundation", "inquiries", kind, page],
    queryFn: () =>
      adminApi.listFoundationInquiries({
        kind: kind || undefined,
        page,
        limit: 20,
      }),
  });

  const detail = useQuery({
    queryKey: ["admin", "foundation", "inquiry", openId],
    queryFn: () => adminApi.getFoundationInquiry(openId as string),
    enabled: Boolean(openId),
  });

  const preview = localPreview || photo.data?.url;
  const busy = upload.isPending || remove.isPending;
  const totalPages = Math.max(
    1,
    Math.ceil((inquiries.data?.total || 0) / (inquiries.data?.limit || 20)),
  );

  function onFile(file: File | undefined) {
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    upload.mutate(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Foundation website</h1>
        <p className="mt-1 text-gray-400">
          Public site media, clinical logos, WhatsApp desk, and form submissions
        </p>
      </div>

      <InquiriesSection
        kind={kind}
        page={page}
        totalPages={totalPages}
        openId={openId}
        inquiries={inquiries.data?.items || []}
        total={inquiries.data?.total || 0}
        loading={inquiries.isLoading}
        fetching={inquiries.isFetching}
        detail={detail.data?.payload}
        detailLoading={detail.isFetching}
        onKind={(next) => {
          setKind(next);
          setPage(1);
          setOpenId(null);
        }}
        onPage={setPage}
        onOpen={setOpenId}
      />

      <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white">Founder&apos;s letter photo</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          Portrait of Dr. Said Athuman Ruwa on the personal note. JPEG, PNG, or
          WebP, up to 2 MB. The live site shows an avatar until a photo is
          published.
        </p>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-56 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-600 bg-gray-900">
            {photo.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Dr. Said Athuman Ruwa"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-16 w-16 text-gray-500" strokeWidth={1.25} />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {upload.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {photo.data?.hasPhoto ? "Replace photo" : "Upload photo"}
              </button>
              {photo.data?.hasPhoto ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove.mutate()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-60"
                >
                  {remove.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remove
                </button>
              ) : null}
            </div>
            {photo.data?.updatedAt ? (
              <p className="text-xs text-gray-500">
                Last updated {new Date(photo.data.updatedAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-xs text-gray-500">No photo published yet</p>
            )}
            {upload.isError ? (
              <p className="text-sm text-red-400">
                {upload.error instanceof Error
                  ? upload.error.message
                  : "Upload failed"}
              </p>
            ) : null}
            {remove.isError ? (
              <p className="text-sm text-red-400">
                {remove.error instanceof Error
                  ? remove.error.message
                  : "Could not remove the photo"}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <ClinicalNetworkSection />
    </div>
  );
}

const IMPACT_FIELDS: {
  key: keyof FoundationImpactFigures;
  label: string;
}[] = [
  { key: "registeredMembers", label: "Registered members" },
  { key: "contributingMembers", label: "Contributing members" },
  { key: "approvedFacilities", label: "Approved facilities" },
  { key: "counties", label: "Counties" },
];

function ClinicalNetworkSection() {
  const queryClient = useQueryClient();
  const [whatsapp, setWhatsapp] = useState("");
  const [classification, setClassification] = useState("");
  const [followLive, setFollowLive] = useState<Record<string, boolean>>({
    registeredMembers: true,
    contributingMembers: true,
    approvedFacilities: true,
    counties: true,
  });
  const [impactDraft, setImpactDraft] = useState<FoundationImpactFigures>({
    registeredMembers: 0,
    contributingMembers: 0,
    approvedFacilities: 0,
    counties: 2,
  });
  const [clinicDrafts, setClinicDrafts] = useState<
    Record<string, { displayName: string; location: string; hidden: boolean }>
  >({});

  const network = useQuery({
    queryKey: ["admin", "foundation", "network"],
    queryFn: () => adminApi.getFoundationNetwork(),
  });

  useEffect(() => {
    const data = network.data;
    if (!data) return;
    setWhatsapp(data.whatsappNumber || "");
    setClassification(data.clinicalClassification || "");
    setFollowLive({
      registeredMembers: data.publishedImpact.registeredMembers == null,
      contributingMembers: data.publishedImpact.contributingMembers == null,
      approvedFacilities: data.publishedImpact.approvedFacilities == null,
      counties: data.publishedImpact.counties == null,
    });
    setImpactDraft(data.impact);
    setClinicDrafts(
      Object.fromEntries(
        data.clinics.map((clinic) => [
          clinic.id,
          {
            displayName: clinic.name,
            location: clinic.location,
            hidden: clinic.hidden,
          },
        ]),
      ),
    );
  }, [network.data]);

  const saveSettings = useMutation({
    mutationFn: (body: Parameters<typeof adminApi.updateFoundationSettings>[0]) =>
      adminApi.updateFoundationSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "foundation", "network"], data);
    },
  });

  const uploadLogo = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      adminApi.uploadFoundationClinicLogo(id, file),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "foundation", "network"], data);
    },
  });

  const removeLogo = useMutation({
    mutationFn: (id: string) => adminApi.removeFoundationClinicLogo(id),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "foundation", "network"], data);
    },
  });

  function publish() {
    const data = network.data;
    saveSettings.mutate({
      whatsappNumber: whatsapp.trim() || null,
      clinicalClassification: classification.trim() || null,
      impact: {
        registeredMembers: followLive.registeredMembers
          ? null
          : impactDraft.registeredMembers,
        contributingMembers: followLive.contributingMembers
          ? null
          : impactDraft.contributingMembers,
        approvedFacilities: followLive.approvedFacilities
          ? null
          : impactDraft.approvedFacilities,
        counties: followLive.counties ? null : impactDraft.counties,
      },
      clinics: (data?.clinics || []).map((clinic) => {
        const draft = clinicDrafts[clinic.id];
        return {
          id: clinic.id,
          displayName: draft?.displayName?.trim() || null,
          location: draft?.location?.trim() || null,
          hidden: Boolean(draft?.hidden),
        };
      }),
    });
  }

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Published Foundation information
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Changes go live on the Foundation site within 30 seconds. Leave a
            figure on “Follow live ledger” to keep using the MenoDAO database.
          </p>
        </div>
        <button
          type="button"
          disabled={saveSettings.isPending || network.isLoading}
          onClick={publish}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {saveSettings.isPending ? "Publishing…" : "Publish changes"}
        </button>
      </div>
      {saveSettings.isError ? (
        <p className="mt-3 text-sm text-red-400">
          {saveSettings.error instanceof Error
            ? saveSettings.error.message
            : "Could not publish settings"}
        </p>
      ) : saveSettings.isSuccess ? (
        <p className="mt-3 text-sm text-emerald-400">Published to the Foundation site</p>
      ) : null}

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Impact figures
      </h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {IMPACT_FIELDS.map((field) => (
          <label
            key={field.key}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-300"
          >
            <span className="font-medium text-white">{field.label}</span>
            <p className="mt-1 text-xs text-gray-500">
              Live ledger: {network.data?.liveImpact[field.key] ?? "—"}
            </p>
            <input
              type="number"
              min={0}
              disabled={followLive[field.key]}
              value={impactDraft[field.key]}
              onChange={(event) =>
                setImpactDraft((current) => ({
                  ...current,
                  [field.key]: Number(event.target.value || 0),
                }))
              }
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white disabled:opacity-50"
            />
            <span className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={followLive[field.key]}
                onChange={(event) =>
                  setFollowLive((current) => ({
                    ...current,
                    [field.key]: event.target.checked,
                  }))
                }
                className="accent-emerald-500"
              />
              Follow live ledger
            </span>
          </label>
        ))}
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Community desk
      </h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-gray-300">
          WhatsApp number
          <input
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="2547XXXXXXXX"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500"
          />
        </label>
        <label className="text-sm text-gray-300 md:col-span-2">
          Clinical section intro
          <textarea
            value={classification}
            onChange={(event) => setClassification(event.target.value)}
            rows={3}
            placeholder="Leave blank to keep the site’s default copy"
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500"
          />
        </label>
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Clinical facilities
      </h3>
      <div className="mt-3 space-y-3">
        {network.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        ) : (
          (network.data?.clinics || []).map((clinic) => (
            <ClinicEditor
              key={clinic.id}
              clinic={clinic}
              draft={
                clinicDrafts[clinic.id] || {
                  displayName: clinic.name,
                  location: clinic.location,
                  hidden: clinic.hidden,
                }
              }
              busy={
                uploadLogo.isPending ||
                removeLogo.isPending ||
                saveSettings.isPending
              }
              onDraft={(next) =>
                setClinicDrafts((current) => ({ ...current, [clinic.id]: next }))
              }
              onUpload={(file) => uploadLogo.mutate({ id: clinic.id, file })}
              onRemove={() => removeLogo.mutate(clinic.id)}
              onMakeAnchor={
                clinic.id === "mikindani"
                  ? undefined
                  : () =>
                      saveSettings.mutate({
                        anchorClinicId: clinic.isAnchor ? null : clinic.id,
                      })
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function ClinicEditor({
  clinic,
  draft,
  busy,
  onDraft,
  onUpload,
  onRemove,
  onMakeAnchor,
}: {
  clinic: FoundationClinicCard;
  draft: { displayName: string; location: string; hidden: boolean };
  busy: boolean;
  onDraft: (next: { displayName: string; location: string; hidden: boolean }) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onMakeAnchor?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        {clinic.logo.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinic.logo.url} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-gray-500">Logo</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {clinic.isAnchor ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
              <Star className="h-3 w-3" />
              Anchor
            </span>
          ) : null}
          {draft.hidden ? (
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
              Hidden on site
            </span>
          ) : null}
        </div>
        <input
          value={draft.displayName}
          onChange={(event) => onDraft({ ...draft, displayName: event.target.value })}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        />
        <input
          value={draft.location}
          onChange={(event) => onDraft({ ...draft, location: event.target.value })}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200"
        />
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={draft.hidden}
            onChange={(event) => onDraft({ ...draft, hidden: event.target.checked })}
            className="accent-emerald-500"
          />
          Hide on the Foundation site
        </label>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.currentTarget.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        {onMakeAnchor ? (
          <button
            type="button"
            disabled={busy}
            onClick={onMakeAnchor}
            className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800 disabled:opacity-60"
          >
            {clinic.isAnchor ? "Clear anchor" : "Set as anchor"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {clinic.logo.hasPhoto ? "Replace" : "Upload"}
        </button>
        {clinic.logo.hasPhoto ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function InquiriesSection({
  kind,
  page,
  totalPages,
  openId,
  inquiries,
  total,
  loading,
  fetching,
  detail,
  detailLoading,
  onKind,
  onPage,
  onOpen,
}: {
  kind: string;
  page: number;
  totalPages: number;
  openId: string | null;
  inquiries: FoundationInquiryRow[];
  total: number;
  loading: boolean;
  fetching: boolean;
  detail?: Record<string, string | string[]>;
  detailLoading: boolean;
  onKind: (kind: string) => void;
  onPage: (page: number) => void;
  onOpen: (id: string | null) => void;
}) {
  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Form submissions</h2>
          <p className="mt-1 text-sm text-gray-400">
            School, volunteer, facility, and contact entries from the Foundation
            site. New records also email menodao.org@gmail.com.
          </p>
        </div>
        <select
          value={kind}
          onChange={(event) => onKind(event.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All pathways</option>
          <option value="SCHOOL">School visits</option>
          <option value="VOLUNTEER">Volunteers</option>
          <option value="FACILITY">Facilities</option>
          <option value="CONTACT">Contact</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Pathway</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-gray-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-gray-500">
                  No submissions yet
                </td>
              </tr>
            ) : (
              inquiries.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-gray-300">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${KIND_CLASS[row.kind]}`}
                    >
                      {KIND_LABEL[row.kind]}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top text-white">
                    {row.name || "—"}
                  </td>
                  <td className="px-3 py-3 align-top text-gray-300">
                    <div>{row.email || "—"}</div>
                    <div className="text-xs text-gray-500">{row.phone || ""}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onOpen(openId === row.id ? null : row.id)}
                      className="text-left text-gray-300 hover:text-white"
                    >
                      {row.summary || "View details"}
                    </button>
                    {openId === row.id ? (
                      <dl className="mt-3 space-y-1 rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs">
                        {detailLoading && !detail ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading fields
                          </div>
                        ) : detail ? (
                          Object.entries(detail)
                            .filter(([key]) => key !== "dpa" && key !== "safeguarding")
                            .map(([key, value]) => (
                              <div key={key} className="grid grid-cols-[8rem_1fr] gap-2">
                                <dt className="text-gray-500">{key}</dt>
                                <dd className="text-gray-200">
                                  {Array.isArray(value) ? value.join(", ") : value}
                                </dd>
                              </div>
                            ))
                        ) : null}
                      </dl>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <p>
          {total} {total === 1 ? "entry" : "entries"}
          {fetching && !loading ? " · refreshing" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="rounded-lg border border-gray-700 p-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            className="rounded-lg border border-gray-700 p-1.5 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
