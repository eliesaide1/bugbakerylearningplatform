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
