import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  BookingInput,
  LeadInput,
  Lesson,
  OkResponse,
  Program,
  SitePayload,
  SlotsPayload,
} from "@shared/types";

export const siteKey = ["site"] as const;

export function useSite() {
  return useQuery({
    queryKey: siteKey,
    queryFn: () => api<SitePayload>("/public/site"),
    staleTime: 60_000,
  });
}

export function useProgram(slug: string | undefined) {
  return useQuery({
    queryKey: ["program", slug],
    queryFn: () => api<Program>(`/public/programs/${slug}`),
    enabled: Boolean(slug),
  });
}

export type FreeLesson = Lesson & { program: { id: string; title: string; slug: string } };

export function useLesson(programSlug: string | undefined, lessonSlug: string | undefined) {
  return useQuery({
    queryKey: ["lesson", programSlug, lessonSlug],
    queryFn: () => api<FreeLesson>(`/public/lessons/${programSlug}/${lessonSlug}`),
    enabled: Boolean(programSlug && lessonSlug),
    retry: false,
  });
}

export function useSubmitLead() {
  return useMutation({
    mutationFn: (payload: LeadInput) => api<OkResponse>("/leads", { method: "POST", body: payload }),
  });
}

export function useSlots() {
  return useQuery({
    queryKey: ["slots"],
    queryFn: () => api<SlotsPayload>("/public/slots"),
    // Someone else may take a slot while this page is open.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookingInput) =>
      api<OkResponse & { start: string; end: string }>("/public/bookings", {
        method: "POST",
        body: payload,
      }),
    // Whether it succeeded or clashed, the open slots have moved on.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["slots"] }),
  });
}

/* ---------------------------- bootcamp ---------------------------- */

import type {
  Enrollment,
  Integrity,
  Submission,
  Track,
  WorkspacePayload,
} from "@shared/types";

export const workspaceKey = (slug?: string) => ["me", "track", slug] as const;

export function useTracks() {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: () => api<Track[]>("/public/tracks"),
    staleTime: 60_000,
  });
}

export function useTrack(slug: string | undefined) {
  return useQuery({
    queryKey: ["track", slug],
    queryFn: () => api<Track>(`/public/tracks/${slug}`),
    enabled: Boolean(slug),
  });
}

/** The whole workspace — track, steps, progress and feedback — in one request. */
export function useWorkspace(slug: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: workspaceKey(slug),
    queryFn: () => api<WorkspacePayload>(`/me/tracks/${slug}`),
    enabled: Boolean(slug) && enabled,
    retry: false,
    // The verdict arrives on the socket, but a dropped connection should not
    // leave someone staring at a spinner — so poll while one is outstanding,
    // and stop the moment it lands.
    refetchInterval: (query) => {
      const waiting = Object.values(query.state.data?.submissions ?? {}).some(
        (submission) => submission.reviewState === "reviewing"
      );
      return waiting ? 3000 : false;
    },
  });
}

export function useMyEnrollments(enabled: boolean) {
  return useQuery({
    queryKey: ["me", "enrollments"],
    queryFn: () => api<Enrollment[]>("/me/enrollments"),
    enabled,
  });
}

export function useJoinTrack(slug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<Enrollment>("/me/enrollments", { method: "POST", body: { slug } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKey(slug) });
      queryClient.invalidateQueries({ queryKey: ["me", "enrollments"] });
    },
  });
}

export interface SubmitInput {
  stepId: string;
  code?: string;
  notes?: string;
  repoUrl?: string;
  commitUrl?: string;
  answers?: string[];
  requestHuman?: boolean;
  /** What the browser observed while the answer was written. */
  integrity?: Integrity;
}

export function useSubmitStep(slug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, ...body }: SubmitInput) =>
      api<{ submission: Submission; enrollment: Enrollment }>(`/me/steps/${stepId}/submit`, {
        method: "POST",
        body,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKey(slug) }),
  });
}

/** Steps that are watched or read finish with a button rather than a form. */
export function useCompleteStep(slug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) =>
      api<Enrollment>(`/me/steps/${stepId}/complete`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKey(slug) }),
  });
}

export function usePeerQueue(enabled: boolean) {
  return useQuery({
    queryKey: ["me", "peer-queue"],
    queryFn: () => api<Submission[]>("/me/peer-queue"),
    enabled,
  });
}

export function useSubmitPeerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verdict, note }: { id: string; verdict: "pass" | "revise"; note: string }) =>
      api<{ ok: boolean; status: string }>(`/me/peer-reviews/${id}`, {
        method: "POST",
        body: { verdict, note },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me", "peer-queue"] }),
  });
}
