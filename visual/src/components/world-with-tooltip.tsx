"use client";

import { useCallback, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { World } from "@/static/world";
import { REGIONAL_MAPS, hasRegionalMap } from "@/lib/regional-maps";

type MapView = "world" | keyof typeof REGIONAL_MAPS;

function getCountryFromTarget(
  target: HTMLElement
): { name: string; id: string | null } | null {
  if (target.tagName === "svg") return null;
  const land = target.closest("path, g, circle");
  if (!land || land.closest("svg") !== target.closest("svg")) return null;
  let el: Element | null = land;
  let titleEl = el.querySelector(":scope > title");
  while (!titleEl && el?.parentElement && el.parentElement.tagName !== "SVG") {
    el = el.parentElement;
    titleEl = el.querySelector(":scope > title");
  }
  const name = titleEl?.textContent?.trim() ?? null;
  if (!name) return null;
  const id = el?.getAttribute("id") ?? null;
  return { name, id };
}

export function WorldWithTooltip() {
  const [view, setView] = useState<MapView>("world");
  const [hovered, setHovered] = useState<{
    name: string;
    id: string | null;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const country = getCountryFromTarget(e.target as HTMLElement);
      if (!country) {
        setHovered(null);
        return;
      }
      setHovered({
        name: country.name,
        id: country.id,
        x: e.clientX,
        y: e.clientY,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (view !== "world") return;
      const country = getCountryFromTarget(e.target as HTMLElement);
      if (country?.id && hasRegionalMap(country.id)) {
        setView(country.id);
      }
    },
    [view]
  );

  const isRegionalView = view !== "world";
  const RegionalComponent = isRegionalView ? REGIONAL_MAPS[view] : null;

  return (
    <div className="relative w-full">
      {isRegionalView && (
        <div className="fixed left-0 top-0 z-10 flex items-center gap-2 p-2">
          <button
            type="button"
            onClick={() => setView("world")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            ← Back to world
          </button>
        </div>
      )}
      <div
        className={`relative w-full ${view === "world" && hovered ? "cursor-pointer" : ""} ${hovered ? "tooltip-open" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {view === "world" ? (
          <World />
        ) : RegionalComponent ? (
          <div className="regional-map mt-12 w-full">
            <RegionalComponent />
          </div>
        ) : null}
        {hovered && (
          <Tooltip open>
            <TooltipTrigger asChild>
              <span
                className="pointer-events-none fixed z-50 size-px"
                style={{ left: hovered.x, top: hovered.y }}
                aria-hidden
              />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {view === "world" &&
              hovered.id &&
              hasRegionalMap(hovered.id)
                ? `${hovered.name} — click to view states`
                : hovered.name}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
