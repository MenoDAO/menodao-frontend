"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import {
  adminApi,
  type FoundationCopyLocale,
  type FoundationCopyOverrides,
  type FoundationFounderVideo,
  type FoundationHeroContent,
  type FoundationMediaItem,
  type FoundationNetwork,
  type FoundationPlaybackRate,
} from "@/lib/admin-api";

const RATES: FoundationPlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const DEFAULT_HERO: FoundationHeroContent = {
  videoUrl: null,
  posterUrl: null,
  playbackRate: 1,
  autoplay: true,
  muted: true,
  loop: true,
};

const DEFAULT_FOUNDER_VIDEO: FoundationFounderVideo = {
  videoUrl: null,
  posterUrl: null,
  caption: null,
  playbackRate: 1,
  muted: true,
};

const EMPTY_COPY: FoundationCopyLocale = {
  eyebrow: null,
  h1: null,
  subhead: null,
  primaryCta: null,
  secondaryCta: null,
  challengeTitle: null,
  pillarsTitle: null,
  letterEyebrow: null,
  letterTitle: null,
  letterBody: null,
  letterSummary: null,
  involvedTitle: null,
  involvedBody: null,
};

const COPY_FIELDS: {
  key: keyof FoundationCopyLocale;
  label: string;
  multiline?: boolean;
}[] = [
  { key: "eyebrow", label: "Eyebrow" },
  { key: "h1", label: "Hero headline" },
  { key: "subhead", label: "Hero subhead", multiline: true },
  { key: "primaryCta", label: "Primary button" },
  { key: "secondaryCta", label: "Secondary button" },
  { key: "challengeTitle", label: "Challenge section title" },
  { key: "pillarsTitle", label: "Pillars section title" },
  { key: "letterEyebrow", label: "Founder note eyebrow" },
  { key: "letterTitle", label: "Founder note title" },
  { key: "letterBody", label: "Founder note body", multiline: true },
  { key: "letterSummary", label: "Founder note summary", multiline: true },
  { key: "involvedTitle", label: "Get involved title" },
  { key: "involvedBody", label: "Get involved body", multiline: true },
];

type ContentPayload = {
  hero: FoundationHeroContent;
  founderVideo: FoundationFounderVideo;
  mediaItems: FoundationMediaItem[];
  copy: FoundationCopyOverrides;
};

export function FoundationContentSection() {
  const network = useQuery({
    queryKey: ["admin", "foundation", "network"],
    queryFn: () => adminApi.getFoundationNetwork(),
  });

  if (!network.data) {
    return (
      <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 text-sm text-gray-400">
        {network.isError
          ? "Could not load Foundation content."
          : "Loading Foundation content…"}
      </section>
    );
  }

  return (
    <FoundationContentEditor
      key={network.data.contentUpdatedAt || "initial"}
      data={network.data}
    />
  );
}

function FoundationContentEditor({ data }: { data: FoundationNetwork }) {
  const queryClient = useQueryClient();
  const [hero, setHero] = useState<FoundationHeroContent>(
    data.hero || DEFAULT_HERO,
  );
  const [founderVideo, setFounderVideo] = useState<FoundationFounderVideo>(
    data.founderVideo || DEFAULT_FOUNDER_VIDEO,
  );
  const [mediaItems, setMediaItems] = useState<FoundationMediaItem[]>(
    data.mediaItems || [],
  );
  const [copy, setCopy] = useState<FoundationCopyOverrides>({
    en: { ...EMPTY_COPY, ...(data.copy?.en || {}) },
    sw: { ...EMPTY_COPY, ...(data.copy?.sw || {}) },
  });

  const save = useMutation({
    mutationFn: (payload: ContentPayload) =>
      adminApi.updateFoundationSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "foundation", "network"], data);
    },
  });

  function publish() {
    save.mutate({ hero, founderVideo, mediaItems, copy });
  }

  function reset() {
    if (
      !window.confirm(
        "Remove all configured Foundation media and copy overrides? The site will return to its built-in defaults.",
      )
    ) {
      return;
    }
    save.mutate({
      hero: DEFAULT_HERO,
      founderVideo: DEFAULT_FOUNDER_VIDEO,
      mediaItems: [],
      copy: { en: EMPTY_COPY, sw: EMPTY_COPY },
    });
  }

  function updateMedia(index: number, patch: Partial<FoundationMediaItem>) {
    setMediaItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function moveMedia(index: number, direction: -1 | 1) {
    setMediaItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setCopyField(
    locale: "en" | "sw",
    key: keyof FoundationCopyLocale,
    value: string,
  ) {
    setCopy((current) => ({
      ...current,
      [locale]: { ...(current[locale] || {}), [key]: value.trim() || null },
    }));
  }

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Landing page media &amp; copy
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">
            Add video and image URLs, choose playback speed, and refresh the
            founder note without a site release. Changes appear on the public
            Foundation site within 30 seconds. Direct MP4/WebM files get
            speed controls; YouTube and Vimeo links use the player&apos;s own
            controls.
          </p>
          {data.contentUpdatedAt ? (
            <p className="mt-2 text-xs text-gray-500">
              Last published {new Date(data.contentUpdatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled={save.isPending}
            onClick={publish}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {save.isPending ? "Publishing…" : "Publish media & copy"}
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {save.isError ? (
        <p className="mt-3 text-sm text-red-400">
          {save.error instanceof Error
            ? save.error.message
            : "Could not publish Foundation content"}
        </p>
      ) : save.isSuccess ? (
        <p className="mt-3 text-sm text-emerald-400">
          Published to the Foundation site
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <fieldset className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-white">
            <Video className="h-4 w-4 text-emerald-400" />
            Hero film
          </legend>
          <p className="mb-4 text-xs text-gray-500">
            Optional. When set, this replaces the photo plate in the hero.
          </p>
          <UrlField
            label="Video URL"
            value={hero.videoUrl}
            onChange={(value) => setHero({ ...hero, videoUrl: value })}
            placeholder="https://cdn.example.org/hero.mp4"
          />
          <UrlField
            label="Poster image URL"
            value={hero.posterUrl}
            onChange={(value) => setHero({ ...hero, posterUrl: value })}
            placeholder="https://cdn.example.org/poster.webp"
          />
          <SpeedField
            value={hero.playbackRate}
            onChange={(playbackRate) => setHero({ ...hero, playbackRate })}
          />
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-300">
            <Checkbox
              label="Autoplay"
              checked={hero.autoplay}
              onChange={(autoplay) => setHero({ ...hero, autoplay })}
            />
            <Checkbox
              label="Start muted"
              checked={hero.muted}
              onChange={(muted) => setHero({ ...hero, muted })}
            />
            <Checkbox
              label="Loop"
              checked={hero.loop}
              onChange={(loop) => setHero({ ...hero, loop })}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-white">
            <Video className="h-4 w-4 text-emerald-400" />
            Founder&apos;s short video
          </legend>
          <p className="mb-4 text-xs text-gray-500">
            Optional. Appears beside the founder note. Keep it under two
            minutes for a personal, scannable message.
          </p>
          <UrlField
            label="Video URL"
            value={founderVideo.videoUrl}
            onChange={(value) => setFounderVideo({ ...founderVideo, videoUrl: value })}
            placeholder="https://youtube.com/watch?v=..."
          />
          <UrlField
            label="Poster image URL"
            value={founderVideo.posterUrl}
            onChange={(value) =>
              setFounderVideo({ ...founderVideo, posterUrl: value })
            }
            placeholder="https://cdn.example.org/founder-poster.webp"
          />
          <label className="mt-3 block text-sm text-gray-300">
            Caption
            <input
              value={founderVideo.caption || ""}
              onChange={(event) =>
                setFounderVideo({
                  ...founderVideo,
                  caption: event.target.value || null,
                })
              }
              maxLength={160}
              placeholder="A two-minute word from Dr. Said"
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
            />
          </label>
          <SpeedField
            value={founderVideo.playbackRate}
            onChange={(playbackRate) =>
              setFounderVideo({ ...founderVideo, playbackRate })
            }
          />
          <div className="mt-3">
            <Checkbox
              label="Start muted"
              checked={founderVideo.muted}
              onChange={(muted) => setFounderVideo({ ...founderVideo, muted })}
            />
          </div>
        </fieldset>
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ImageIcon className="h-4 w-4 text-emerald-400" />
              Media gallery
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Up to 12 cards. Mix stills and short clips; reorder with the
              arrows. Leave empty to use the built-in field gallery.
            </p>
          </div>
          <button
            type="button"
            disabled={mediaItems.length >= 12}
            onClick={() =>
              setMediaItems((current) => [
                ...current,
                {
                  id: `media-${Date.now()}`,
                  kind: "image",
                  src: "",
                  posterUrl: null,
                  alt: null,
                  altSw: null,
                  caption: null,
                  captionSw: null,
                  href: null,
                  playbackRate: 1,
                },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add card
          </button>
        </div>

        {mediaItems.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
            No custom cards yet — the Foundation site is using its built-in
            gallery.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {mediaItems.map((item, index) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium tabular-nums text-gray-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <select
                    value={item.kind}
                    onChange={(event) =>
                      updateMedia(index, {
                        kind: event.target.value as "image" | "video",
                      })
                    }
                    className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <div className="ml-auto flex items-center gap-1">
                    <IconButton
                      label="Move up"
                      disabled={index === 0}
                      onClick={() => moveMedia(index, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Move down"
                      disabled={index === mediaItems.length - 1}
                      onClick={() => moveMedia(index, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Remove card"
                      onClick={() =>
                        setMediaItems((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <UrlField
                    label={item.kind === "video" ? "Video URL" : "Image URL"}
                    value={item.src}
                    onChange={(value) => updateMedia(index, { src: value })}
                    placeholder="https://…"
                    compact
                  />
                  {item.kind === "video" ? (
                    <>
                      <UrlField
                        label="Poster image URL"
                        value={item.posterUrl || null}
                        onChange={(value) =>
                          updateMedia(index, { posterUrl: value })
                        }
                        placeholder="https://…"
                        compact
                      />
                      <SpeedField
                        value={item.playbackRate || 1}
                        onChange={(playbackRate) =>
                          updateMedia(index, { playbackRate })
                        }
                        compact
                      />
                    </>
                  ) : null}
                  <InputField
                    label="Alt text (EN)"
                    value={item.alt || null}
                    onChange={(value) => updateMedia(index, { alt: value })}
                    placeholder="Students in a classroom"
                    compact
                  />
                  <InputField
                    label="Alt text (SW)"
                    value={item.altSw || null}
                    onChange={(value) => updateMedia(index, { altSw: value })}
                    placeholder="Wanafunzi darasani"
                    compact
                  />
                  <InputField
                    label="Caption (EN)"
                    value={item.caption || null}
                    onChange={(value) => updateMedia(index, { caption: value })}
                    placeholder="School outreach, Mombasa"
                    compact
                  />
                  <InputField
                    label="Caption (SW)"
                    value={item.captionSw || null}
                    onChange={(value) =>
                      updateMedia(index, { captionSw: value })
                    }
                    placeholder="Ufikaji shuleni, Mombasa"
                    compact
                  />
                  <UrlField
                    label="Link URL (optional)"
                    value={item.href || null}
                    onChange={(value) => updateMedia(index, { href: value })}
                    placeholder="https://…"
                    compact
                  />
                </div>

                {item.kind === "image" && item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt=""
                    className="mt-3 h-20 w-full rounded border border-gray-700 object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">
          Copy overrides (EN / Kiswahili)
        </summary>
        <p className="mt-2 text-xs text-gray-500">
          Leave a field blank to keep the site&apos;s approved translation.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {(["en", "sw"] as const).map((locale) => (
            <div key={locale}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {locale === "en" ? "English" : "Kiswahili"}
              </h4>
              <div className="space-y-3">
                {COPY_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className="block text-xs text-gray-300"
                  >
                    {field.label}
                    {field.multiline ? (
                      <textarea
                        rows={field.key === "letterBody" ? 5 : 2}
                        value={copy[locale]?.[field.key] || ""}
                        onChange={(event) =>
                          setCopyField(locale, field.key, event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                      />
                    ) : (
                      <input
                        value={copy[locale]?.[field.key] || ""}
                        onChange={(event) =>
                          setCopyField(locale, field.key, event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function UrlField({
  label,
  value,
  onChange,
  placeholder,
  compact,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <InputField
      label={label}
      value={value}
      onChange={(next) => onChange(next ? next.trim() || null : null)}
      placeholder={placeholder}
      compact={compact}
    />
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  compact,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <label className={`block text-sm text-gray-300 ${compact ? "text-xs" : ""}`}>
      {label}
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value || null)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 ${
          compact ? "text-xs" : "text-sm"
        }`}
      />
    </label>
  );
}

function SpeedField({
  value,
  onChange,
  compact,
}: {
  value: FoundationPlaybackRate;
  onChange: (value: FoundationPlaybackRate) => void;
  compact?: boolean;
}) {
  return (
    <label className={`mt-3 block text-sm text-gray-300 ${compact ? "text-xs" : ""}`}>
      Playback speed
      <select
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value) as FoundationPlaybackRate)
        }
        className={`mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {RATES.map((rate) => (
          <option key={rate} value={rate}>
            {rate}×
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-emerald-500"
      />
      {label}
    </label>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
