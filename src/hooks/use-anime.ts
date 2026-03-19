"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

type AnimeParams = Omit<anime.AnimeParams, "targets">;

/** Animate a ref on mount */
export function useAnime<T extends HTMLElement>(params: AnimeParams) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    if (!ref.current) return;
    const instance = anime({
      targets: ref.current,
      ...params,
    });
    return () => instance.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Stagger animate children on mount */
export function useStagger<T extends HTMLElement>(
  params: AnimeParams & { staggerDelay?: number }
) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.children;
    if (!children.length) return;

    const instance = anime({
      targets: children,
      delay: anime.stagger(params.staggerDelay ?? 60),
      ...params,
    });
    return () => instance.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Reusable fade-in-up preset */
export function useFadeIn<T extends HTMLElement>(delay = 0) {
  return useAnime<T>({
    opacity: [0, 1],
    translateY: [8, 0],
    duration: 400,
    easing: "easeOutCubic",
    delay,
  });
}