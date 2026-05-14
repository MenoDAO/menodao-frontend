"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const TOUR_PAD = 8;
const TOOLTIP_W = 320;
const TOUR_Z = 500;

type TourStep = {
  tourId: string;
  route?: string;
};

const TOUR_STEPS: TourStep[] = [
  { tourId: "tour-membership", route: "/dashboard" },
  { tourId: "tour-nav-subscription" },
  { tourId: "tour-nav-claims" },
  { tourId: "tour-nav-history" },
  { tourId: "tour-nav-champion" },
  { tourId: "tour-nav-camps" },
  { tourId: "tour-nav-blockchain" },
  { tourId: "tour-nav-profile" },
];

function getVisibleTourElement(tourId: string): HTMLElement | null {
  const list = document.querySelectorAll<HTMLElement>(`[data-tour="${tourId}"]`);
  let fallback: HTMLElement | null = null;
  for (const el of list) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    fallback = el;
    const inView =
      r.bottom > 0 &&
      r.top < window.innerHeight &&
      r.right > 0 &&
      r.left < window.innerWidth;
    if (inView) return el;
  }
  return fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Rect = { top: number; left: number; width: number; height: number };

export type DashboardOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
  setMobileNavOpen?: (open: boolean) => void;
};

/** One SVG layer: dim everywhere except a clear hole (no stacked scrims). */
function SpotlightShroud({
  hole,
  vw,
  vh,
  maskSuffix,
}: {
  hole: Rect;
  vw: number;
  vh: number;
  maskSuffix: string;
}) {
  const { top, left, width, height } = hole;
  const maskId = `menodao-tour-mask-${maskSuffix}`;
  const rx = 12;

  return (
    <svg
      width={vw}
      height={vh}
      className="pointer-events-auto fixed left-0 top-0 shrink-0"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width={vw} height={vh} fill="white" />
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx={rx}
            ry={rx}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(0,0,0,0.55)"
        mask={`url(#${maskId})`}
      />
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={rx}
        ry={rx}
        fill="none"
        stroke="rgb(16, 185, 129)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function DashboardOnboardingGuide({
  open,
  onDismiss,
  setMobileNavOpen,
}: DashboardOnboardingGuideProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const reactId = useId().replace(/:/g, "");
  const [stepIndex, setStepIndex] = useState(0);
  const [hole, setHole] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const total = TOUR_STEPS.length;
  const titleKey = `onboarding.tour.step${stepIndex}Title`;
  const bodyKey = `onboarding.tour.step${stepIndex}Body`;

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setStepIndex(0), 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const route = TOUR_STEPS[stepIndex]?.route;
    if (route && pathname !== route) {
      router.replace(route);
    }
  }, [open, stepIndex, pathname, router]);

  const measure = useCallback(() => {
    if (!open || typeof window === "undefined") return;
    const tourId = TOUR_STEPS[stepIndex]?.tourId;
    if (!tourId) {
      setHole(null);
      return;
    }
    const el = getVisibleTourElement(tourId);
    const tw = Math.min(TOOLTIP_W, window.innerWidth - 32);
    const estH = 210;

    if (!el) {
      setHole(null);
      setTooltipPos({
        top: Math.max(16, window.innerHeight * 0.58),
        left: window.innerWidth / 2 - tw / 2,
      });
      return;
    }

    const r = el.getBoundingClientRect();
    const pad = TOUR_PAD;
    setHole({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobileNavHighlight =
      vw < 768 && stepIndex > 0 && tourId.startsWith("tour-nav-");

    if (isMobileNavHighlight) {
      const bottomReserved = 20;
      const tooltipH = 230;
      setTooltipPos({
        top: Math.max(16, vh - bottomReserved - tooltipH),
        left: (vw - tw) / 2,
      });
    } else {
      let tTop = r.bottom + pad + 10;
      if (tTop + estH > vh - 16) {
        tTop = r.top - estH - pad - 10;
      }
      tTop = clamp(tTop, 16, vh - estH - 16);
      const cx = r.left + r.width / 2;
      let tLeft = cx - tw / 2;
      tLeft = clamp(tLeft, 16, vw - tw - 16);
      setTooltipPos({ top: tTop, left: tLeft });
    }
  }, [open, stepIndex]);

  useLayoutEffect(() => {
    if (!open || typeof window === "undefined") return;

    if (window.innerWidth < 768 && setMobileNavOpen) {
      if (stepIndex === 0) {
        flushSync(() => setMobileNavOpen(false));
      } else {
        flushSync(() => setMobileNavOpen(true));
      }
    }

    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => measure());
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [open, stepIndex, pathname, measure, setMobileNavOpen]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, measure]);

  const finish = useCallback(() => {
    setMobileNavOpen?.(false);
    onDismiss();
  }, [onDismiss, setMobileNavOpen]);

  const goNext = useCallback(() => {
    if (stepIndex >= total - 1) {
      finish();
      return;
    }
    setHole(null);
    setStepIndex((i) => i + 1);
  }, [stepIndex, total, finish]);

  const goSkip = useCallback(() => {
    finish();
  }, [finish]);

  if (!open || typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  /** Unique mask id per step so SVG defs never collide in the DOM. */
  const maskSuffix = `${reactId}-${stepIndex}`;

  const overlay = (
    <div
      className="pointer-events-none fixed inset-0 isolate"
      style={{ zIndex: TOUR_Z }}
      aria-live="polite"
    >
      {hole ? (
        <SpotlightShroud
          key={maskSuffix}
          hole={hole}
          vw={vw}
          vh={vh}
          maskSuffix={maskSuffix}
        />
      ) : (
        <div
          key="tour-full-dim"
          className="pointer-events-auto fixed inset-0 bg-black/55"
          style={{ zIndex: 0 }}
        />
      )}

      <div
        key={stepIndex}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        className="pointer-events-auto fixed z-10 w-[min(100vw-2rem,320px)] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl p-5"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
          {t("onboarding.tour.progress", {
            current: stepIndex + 1,
            total,
          })}
        </p>
        <h2
          id="tour-step-title"
          className="text-lg font-bold text-gray-900 dark:text-white font-outfit leading-snug"
        >
          {t(titleKey)}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
          {!hole ? t("onboarding.tour.targetMissing") : t(bodyKey)}
        </p>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={goSkip}
            className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors"
          >
            {t("onboarding.tour.skip")}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            {stepIndex >= total - 1
              ? t("onboarding.tour.done")
              : t("onboarding.tour.next")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
