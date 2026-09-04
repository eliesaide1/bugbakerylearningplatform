import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  Availability,
  Booking,
  BookingStatus,
  Faq,
  Lead,
  Lesson,
  Media,
  OkResponse,
  Program,
  Section,
  SiteSettings,
  Technology,
  Theme,
} from "@shared/types";

/** Resource names line up with the socket payload's `resource` field. */
export type ResourceName =
  | "sections"
  | "programs"
  | "lessons"
  | "faqs"
  | "technologies"
  | "media"
  | "leads";

export interface ResourceMap {
  sections: Section;
  programs: Program;
  lessons: Lesson;
  faqs: Faq;
  technologies: Technology;
  media: Media;
  leads: Lead;
}

export const key = {
  list: (resource: ResourceName, params?: Record<string, string>) =>
    params && Object.keys(params).length ? (["admin", resource, params] as const) : (["admin", resource] as const),
  settings: ["admin", "settings"] as const,
  theme: ["admin", "theme"] as const,
  me: ["admin", "me"] as const,
};

const qs = (params?: Record<string, string>) => {
  if (!params) return "";
  const clean = Object.entries(params).filter(([, v]) => v !== "" && v !== undefined);
  return clean.length ? `?${new URLSearchParams(Object.fromEntries(clean)).toString()}` : "";
};

/* ------------------------------ reads ------------------------------ */

export function useList<R extends ResourceName>(resource: R, params?: Record<string, string>) {
  return useQuery({
    queryKey: key.list(resource, params),
    queryFn: () => api<ResourceMap[R][]>(`/admin/${resource}${qs(params)}`),
  });
}

export function useSettings() {
  return useQuery({ queryKey: key.settings, queryFn: () => api<SiteSettings>("/admin/settings") });
}

export function useTheme() {
  return useQuery({ queryKey: key.theme, queryFn: () => api<Theme>("/admin/theme") });
}

/* ------------------------------ writes ----------------------------- */

/**
 * Every mutation invalidates its own list. The socket does the same for other
 * connected editors, so two people editing at once stay in step.
 */
function useInvalidate(resource: ResourceName) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", resource] });
}

export function useCreate<R extends ResourceName>(resource: R) {
  const invalidate = useInvalidate(resource);
  return useMutation({
    mutationFn: (body: Partial<ResourceMap[R]>) =>
      api<ResourceMap[R]>(`/admin/${resource}`, { method: "POST", body }),
    onSuccess: invalidate,
  });
}

export function useUpdate<R extends ResourceName>(resource: R) {
  const invalidate = useInvalidate(resource);
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ResourceMap[R]> & { id: string }) =>
      api<ResourceMap[R]>(`/admin/${resource}/${id}`, { method: "PATCH", body }),
    onSuccess: invalidate,
  });
}

export function useRemove(resource: ResourceName) {
  const invalidate = useInvalidate(resource);
  return useMutation({
    mutationFn: (id: string) => api<OkResponse>(`/admin/${resource}/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useReorder(resource: ResourceName) {
  const invalidate = useInvalidate(resource);
  return useMutation({
    mutationFn: (ids: string[]) =>
      api<OkResponse>(`/admin/${resource}/bulk/reorder`, { method: "PATCH", body: { ids } }),
    onSuccess: invalidate,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<SiteSettings>) =>
      api<SiteSettings>("/admin/settings", { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key.settings }),
  });
}

export function useSaveTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Theme>) => api<Theme>("/admin/theme", { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key.theme }),
  });
}

export function useResetTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<Theme>("/admin/theme/reset", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key.theme }),
  });
}

/** Images and videos. Sends multipart, so it skips the JSON path. */
export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ files, folder, alt }: { files: File[]; folder?: string; alt?: string }) => {
      const form = new FormData();
      // Fields before files: multer only sees a field when writing the file to
      // disk if it arrived first. The server no longer depends on this, but
      // sending it in this order is what lets the chosen folder be honoured.
      if (folder) form.append("folder", folder);
      if (alt) form.append("alt", alt);
      files.forEach((file) => form.append("files", file));
      return api<Media[]>("/admin/media/upload", { method: "POST", form });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "media"] }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; notes?: string }) =>
      api<Lead>(`/admin/leads/${id}`, { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }),
  });
}

/* --------------------------- 1:1 booking --------------------------- */

export const bookingKeys = {
  availability: ["admin", "availability"] as const,
  bookings: ["admin", "bookings"] as const,
};

export function useAvailability() {
  return useQuery({
    queryKey: bookingKeys.availability,
    queryFn: () => api<Availability>("/admin/availability"),
  });
}

export function useSaveAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Availability>) =>
      api<Availability>("/admin/availability", { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.availability }),
  });
}

export function useBookings(params?: Record<string, string>) {
  return useQuery({
    queryKey: params ? ([...bookingKeys.bookings, params] as const) : bookingKeys.bookings,
    queryFn: () => api<Booking[]>(`/admin/bookings${qs(params)}`),
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: BookingStatus; note?: string }) =>
      api<Booking>(`/admin/bookings/${id}`, { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.bookings }),
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<OkResponse>(`/admin/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.bookings }),
  });
}
