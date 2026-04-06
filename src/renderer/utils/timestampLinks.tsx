/**
 * Shared timestamp utilities for coaching output.
 * Converts [M:SS] timestamps into clickable Dolphin replay launchers.
 */
import type { Components } from "react-markdown";

const FPS = 60;
const FIRST_PLAYABLE = -123; // Frames.FIRST_PLAYABLE from slippi-js

/** Convert a "M:SS" timestamp string back to a game frame number */
export function timestampToFrame(ts: string): number {
  const parts = ts.split(":");
  if (parts.length !== 2) return 0;
  const minutes = parseInt(parts[0]!, 10);
  const seconds = parseInt(parts[1]!, 10);
  if (isNaN(minutes) || isNaN(seconds)) return 0;
  return (minutes * 60 + seconds) * FPS + FIRST_PLAYABLE;
}

/** Pre-process coaching markdown to convert [M:SS] timestamps into inline code spans */
export function injectTimestampLinks(text: string): string {
  return text.replace(/\[(\d{1,2}:\d{2})\]/g, "`ts:$1`");
}

/** Create react-markdown components that render timestamp code spans as clickable buttons */
export function makeTimestampComponents(replayPath: string): Components {
  return {
    code: ({ children }) => {
      const text = String(children);
      const match = text.match(/^ts:(\d{1,2}:\d{2})$/);
      if (match) {
        const ts = match[1]!;
        const frame = timestampToFrame(ts);
        const handleClick = async (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const el = e.currentTarget as HTMLElement;
          el.classList.add("timestamp-loading");
          try {
            await window.clippi.openInDolphinAtFrame(replayPath, frame);
          } catch (err) {
            console.error("Failed to open Dolphin at timestamp:", err);
            el.title = `Error: ${err instanceof Error ? err.message : String(err)}`;
            el.classList.add("timestamp-error");
            setTimeout(() => {
              el.classList.remove("timestamp-error");
              el.title = `Open replay at ${ts}`;
            }, 5000);
          } finally {
            el.classList.remove("timestamp-loading");
          }
        };
        return (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(e as any); } }}
            className="timestamp-link"
            title={`Open replay at ${ts} — Dolphin will fast-forward to this point, hang tight`}
          >
            ▶ {ts}
          </span>
        );
      }
      return <code>{children}</code>;
    },
    a: ({ href, children }) => {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.preventDefault()}>
          {children}
        </a>
      );
    },
  };
}

export const TIMESTAMP_PATTERN = /\[\d{1,2}:\d{2}\]/;
