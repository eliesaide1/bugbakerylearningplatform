import { useEffect } from "react";
import { applyTheme } from "@shared/styles";
import { useTheme } from "../api/queries";

/**
 * The CMS wears the same palette it edits, so a colour change previews itself
 * across the admin UI the moment it is saved — by you or by another editor.
 */
export function useThemeSync() {
  const { data } = useTheme();

  useEffect(() => {
    applyTheme(data);
  }, [data]);
}
