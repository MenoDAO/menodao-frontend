"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const TOUR_PAD = 8;
const TOOLTIP_W = 320;

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

export default function DashboardOnboardingGuide({
  open,
  onDismiss,
  setMobileNavOpen,
}: DashboardOnboardingGuideProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
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

    let tTop = r.bottom + pad + 10;
    if (tTop + estH > window.innerHeight - 16) {
      tTop = r.top - estH - pad - 10;
    }
    tTop = clamp(tTop, 16, window.innerHeight - estH - 16);
    const cx = r.left + r.width / 2;
    let tLeft = cx - tw / 2;
    tLeft = clamp(tLeft, 16, window.innerWidth - tw - 16);
    setTooltipPos({ top: tTop, left: tLeft });
  }, [open, stepIndex]);

  /** Mobile drawer must exist in the DOM before we measure nav targets (useEffect was too late). */
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
    setStepIndex((i) => i + 1);
  }, [stepIndex, total, finish]);

  const goSkip = useCallback(() => {
    finish();
  }, [finish]);

  if (!open || typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tour-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100]"
          aria-live="polite"
        >
          {hole ? (
            <>
              <motion.div
                className="fixed left-0 right-0 top-0 z-[100] bg-black/60 pointer-events-auto"
                initial={false}
                animate={{ height: Math.max(0, hole.top) }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
              <motion.div
                className="fixed left-0 right-0 z-[100] bg-black/60 pointer-events-auto"
                initial={false}
                animate={{
                  top: hole.top + hole.height,
                  height: Math.max(0, vh - hole.top - hole.height),
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
              <motion.div
                className="fixed left-0 z-[100] bg-black/60 pointer-events-auto"
                initial={false}
                animate={{
                  top: hole.top,
                  width: Math.max(0, hole.left),
                  height: hole.height,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
              <motion.div
                className="fixed z-[100] bg-black/60 pointer-events-auto"
                initial={false}
                animate={{
                  top: hole.top,
                  left: hole.left + hole.width,
                  width: Math.max(0, vw - hole.left - hole.width),
                  height: hole.height,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
              <motion.div
                className="fixed z-[112] rounded-xl border-2 border-emerald-400 pointer-events-none shadow-[0_0_0_4px_rgba(16,185,129,0.22)]"
                initial={false}
                animate={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.width,
                  height: hole.height,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            </>
          ) : (
            <div className="fixed inset-0 z-[100] bg-black/60 pointer-events-auto" />
          )}

          <motion.div
            key={stepIndex}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-step-title"
            className="fixed z-[115] w-[min(100vw-2rem,320px)] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl pointer-events-auto p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
