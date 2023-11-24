import React from "react";

import { useEveShipFitLink } from "../EveShipFitLink";

import styles from "./ShipFit.module.css";

const useIsRemoteViewer = () => {
  const [remote, setRemote] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setRemote(window.location.hostname !== "eveship.fit");
    }
  }, []);

  return remote;
}

/* Based on https://github.com/mantinedev/mantine/blob/master/src/mantine-hooks/src/use-clipboard/use-clipboard.ts */
export function useClipboard({ timeout = 2000 } = {}) {
  const [copied, setCopied] = React.useState(false);
  const [copyTimeout, setCopyTimeout] = React.useState<number | undefined>(undefined);

  const handleCopyResult = (value: boolean) => {
    if (copyTimeout !== undefined) {
      window.clearTimeout(copyTimeout);
    }
    setCopyTimeout(window.setTimeout(() => setCopied(false), timeout));
    setCopied(value);
  };

  const copy = (valueToCopy: string) => {
    navigator.clipboard.writeText(valueToCopy).then(() => handleCopyResult(true));
  };

  return { copy, copied };
}

export const FitLink = () => {
  const link = useEveShipFitLink();
  const isRemoteViewer = useIsRemoteViewer();
  const { copy, copied } = useClipboard();

  const linkText = isRemoteViewer ? "open on eveship.fit" : "share fit";
  const linkPropsClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    copy(link);
  }, [copy, link]);
  const linkProps = {
    onClick: isRemoteViewer ? undefined : linkPropsClick,
  };

  return <div className={styles.fitlink}>
    <svg viewBox="0 0 730 730" xmlns="http://www.w3.org/2000/svg">
      <path
        id="fitlink"
        fill="none"
        d="M18,365 A25,25 0 0,1 712,365" />

      <a href={link} target="_new" {...linkProps}>
        <text textAnchor="middle">
          <textPath startOffset="50%" href="#fitlink" fill="#cdcdcd">{copied ? "copied to clipboard" : linkText}</textPath>
        </text>
      </a>
    </svg>
  </div>
}