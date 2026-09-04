import { useEffect } from "react";
import { applyTheme } from "@shared/styles";
import { useSite } from "../api/queries";

/**
 * Pushes the CMS-managed palette onto :root. The site query is refetched
 * whenever a content:changed event arrives, so editing a colour in the CMS
 * repaints every open tab within a moment.
 */
export function useThemeSync() {
  const { data } = useSite();
  const theme = data?.theme;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}
