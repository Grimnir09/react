import React from "react";

import { EsiFit, ShipSnapshotContext } from "../ShipSnapshotProvider";

async function compress(str: string): Promise<string> {
  const stream = new Blob([str]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
  const reader = compressedStream.getReader();

  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    result += String.fromCharCode.apply(null, value);
  }

  return btoa(result);
}

async function encodeEsiFit(esiFit: EsiFit): Promise<string> {
  let result = `${esiFit.ship_type_id},${esiFit.name},${esiFit.description}\n`;

  for (const item of esiFit.items) {
    result += `${item.flag},${item.type_id},${item.quantity},${item.charge?.type_id ?? ""},${item.state ?? ""}\n`;
  }

  return "v2:" + (await compress(result));
}

/**
 * Returns an encoded hash with the current fit.
 */
export function useEveShipFitLinkHash() {
  const [fitHash, setFitHash] = React.useState("");
  const shipSnapshot = React.useContext(ShipSnapshotContext);

  React.useEffect(() => {
    if (!shipSnapshot?.loaded) return;

    async function doCreateHash() {
      if (!shipSnapshot?.currentFit) {
        setFitHash("");
        return;
      }

      const newFitHash = await encodeEsiFit(shipSnapshot.currentFit);
      setFitHash(`#fit:${newFitHash}`);
    }
    doCreateHash();
  }, [shipSnapshot?.loaded, shipSnapshot?.currentFit]);

  return fitHash;
}

/**
 * Returns a link to https://eveship.fit that contains the current fit.
 */
export function useEveShipFitLink() {
  const fitHash = useEveShipFitLinkHash();
  const [fitLink, setFitLink] = React.useState("");

  React.useEffect(() => {
    async function doCreateLink() {
      if (fitHash === "") {
        setFitLink("");
        return;
      }

      setFitLink(`https://eveship.fit/${fitHash}`);
    }
    doCreateLink();
  }, [fitHash]);

  return fitLink;
}

/**
 * useEveShipFitLink() converts the current fit into a link to https://eveship.fit.
 *
 * Note: do not use this React component itself, but the useEveShipFitLink() React hook instead.
 */
export const EveShipFitLink = () => {
  const eveShipFitLinkHash = useEveShipFitLinkHash();
  const eveShipFitLink = useEveShipFitLink();

  return (
    <pre>
      Hash: {eveShipFitLinkHash}
      <br />
      Link: {eveShipFitLink}
    </pre>
  );
};
