import clsx from "clsx";
import React from "react";

import { defaultDataUrl } from "../settings";
import { EveDataContext } from "../EveDataProvider";
import { Icon } from "../Icon";
import { ShipSnapshotContext, ShipSnapshotSlotsType } from "../ShipSnapshotProvider";
import { TreeListing, TreeHeader, TreeLeaf } from "../TreeListing";

import styles from "./HardwareListing.module.css";

interface ModuleCharge {
  typeId: number;
  name: string;
  chargeGroupIDs: number[];
  chargeSize: number;
}

interface ListingItem {
  name: string;
  meta: number;
  typeId: number;
  slotType: ShipSnapshotSlotsType | "dronebay" | "charge";
}

interface ListingGroup {
  name: string;
  meta: number;
  iconID?: number;
  groups: Record<string, ListingGroup>;
  items: ListingItem[];
}

interface Filter {
  lowslot: boolean;
  medslot: boolean;
  hislot: boolean;
  rig_subsystem: boolean;
  drone: boolean;
  moduleWithCharge: ModuleCharge | undefined;
}

const ModuleGroup = (props: { level: number; group: ListingGroup; hideGroup?: boolean }) => {
  const shipSnapShot = React.useContext(ShipSnapshotContext);

  const getChildren = React.useCallback(() => {
    return (
      <>
        {Object.values(props.group.items)
          .sort((a, b) => a.meta - b.meta || a.name.localeCompare(b.name))
          .map((item) => {
            if (item.slotType === "charge") {
              return (
                <TreeLeaf
                  key={item.typeId}
                  level={2}
                  content={item.name}
                  onClick={() => shipSnapShot.addCharge(item.typeId)}
                />
              );
            } else {
              const slotType = item.slotType;
              return (
                <TreeLeaf
                  key={item.typeId}
                  level={2}
                  content={item.name}
                  onClick={() => shipSnapShot.addModule(item.typeId, slotType)}
                />
              );
            }
          })}
        {Object.keys(props.group.groups)
          .sort(
            (a, b) =>
              props.group.groups[a].meta - props.group.groups[b].meta ||
              props.group.groups[a].name.localeCompare(props.group.groups[b].name),
          )
          .map((groupId) => {
            return <ModuleGroup key={groupId} level={props.level + 1} group={props.group.groups[groupId]} />;
          })}
      </>
    );
  }, [props, shipSnapShot]);

  if (props.hideGroup) {
    return <TreeListing level={props.level} getChildren={getChildren} />;
  }

  const header = (
    <TreeHeader
      icon={props.group.iconID === undefined ? "" : `${defaultDataUrl}icons/${props.group.iconID}.png`}
      text={props.group.name}
    />
  );
  return <TreeListing level={props.level} header={header} getChildren={getChildren} />;
};

/**
 * Show all the modules you can fit to a ship.
 */
export const HardwareListing = () => {
  const eveData = React.useContext(EveDataContext);
  const shipSnapShot = React.useContext(ShipSnapshotContext);

  const [moduleGroups, setModuleGroups] = React.useState<ListingGroup>({
    name: "Modules",
    meta: 0,
    groups: {},
    items: [],
  });
  const [chargeGroups, setChageGroups] = React.useState<ListingGroup>({
    name: "Charges",
    meta: 0,
    groups: {},
    items: [],
  });
  const [search, setSearch] = React.useState<string>("");
  const [filter, setFilter] = React.useState<Filter>({
    lowslot: false,
    medslot: false,
    hislot: false,
    rig_subsystem: false,
    drone: false,
    moduleWithCharge: undefined,
  });
  const [selection, setSelection] = React.useState<"modules" | "charges">("modules");
  const [modulesWithCharges, setModulesWithCharges] = React.useState<ModuleCharge[]>([]);

  React.useEffect(() => {
    if (!eveData.loaded) return;
    if (!shipSnapShot.loaded || shipSnapShot.items === undefined) return;

    /* Iterate all items to check if they have a charge. */
    const newModulesWithCharges: ModuleCharge[] = [];
    const seenModules = new Set<number>();
    for (const item of shipSnapShot.items) {
      const chargeGroup1 = item.attributes.get(eveData?.attributeMapping?.chargeGroup1 || 0)?.value;
      const chargeGroup2 = item.attributes.get(eveData?.attributeMapping?.chargeGroup2 || 0)?.value;
      const chargeGroup3 = item.attributes.get(eveData?.attributeMapping?.chargeGroup3 || 0)?.value;
      const chargeGroup4 = item.attributes.get(eveData?.attributeMapping?.chargeGroup4 || 0)?.value;
      const chargeGroup5 = item.attributes.get(eveData?.attributeMapping?.chargeGroup5 || 0)?.value;

      const chargeGroupIDs: number[] = [chargeGroup1, chargeGroup2, chargeGroup3, chargeGroup4, chargeGroup5].filter(
        (x): x is number => x !== undefined,
      );

      if (chargeGroupIDs.length === 0) continue;
      if (seenModules.has(item.type_id)) continue;
      seenModules.add(item.type_id);

      newModulesWithCharges.push({
        typeId: item.type_id,
        name: eveData?.typeIDs?.[item.type_id].name ?? "Unknown",
        chargeGroupIDs,
        chargeSize: item.attributes.get(eveData?.attributeMapping?.chargeSize || 0)?.value ?? -1,
      });
    }

    setModulesWithCharges(newModulesWithCharges);

    /* If the moduleWithCharge filter was set, validate if it is still valid. */
    if (newModulesWithCharges.find((charge) => charge.typeId === filter.moduleWithCharge?.typeId) !== undefined) return;

    setFilter({
      ...filter,
      moduleWithCharge: undefined,
    });

    /* Filter should not be part of the dependency array. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipSnapShot, eveData, setFilter]);

  React.useEffect(() => {
    if (!eveData.loaded) return;

    const newModuleGroups: ListingGroup = {
      name: "Modules",
      meta: 0,
      groups: {},
      items: [],
    };
    const newChargeGroups: ListingGroup = {
      name: "Charges",
      meta: 0,
      groups: {},
      items: [],
    };

    for (const typeId in eveData.typeIDs) {
      const module = eveData.typeIDs[typeId];
      /* Modules (7), Charges (8), Drones (18), Subsystems (32), and Structures (66) */
      if (
        module.categoryID !== 7 &&
        module.categoryID !== 8 &&
        module.categoryID !== 18 &&
        module.categoryID !== 32 &&
        module.categoryID !== 66
      ) {
        continue;
      }
      if (module.marketGroupID === undefined) continue;
      if (!module.published) continue;

      let slotType: ShipSnapshotSlotsType | "dronebay" | "charge" | undefined;
      if (module.categoryID !== 8) {
        slotType = eveData.typeDogma?.[typeId]?.dogmaEffects
          .map((effect) => {
            switch (effect.effectID) {
              case 11:
                return "lowslot";
              case 13:
                return "medslot";
              case 12:
                return "hislot";
              case 2663:
                return "rig";
              case 3772:
                return "subsystem";
            }
          })
          .filter((slot) => slot !== undefined)[0];
        if (module.categoryID === 18) {
          slotType = "dronebay";
        }

        if (slotType === undefined) continue;

        if (filter.lowslot || filter.medslot || filter.hislot || filter.rig_subsystem || filter.drone) {
          if (slotType === "lowslot" && !filter.lowslot) continue;
          if (slotType === "medslot" && !filter.medslot) continue;
          if (slotType === "hislot" && !filter.hislot) continue;
          if ((slotType === "rig" || slotType === "subsystem") && !filter.rig_subsystem) continue;
          if (module.categoryID === 18 && !filter.drone) continue;
        }
      } else {
        if (filter.moduleWithCharge !== undefined) {
          /* If the module has size restrictions, ensure the charge matches. */
          const chargeSize =
            eveData.typeDogma?.[typeId]?.dogmaAttributes.find(
              (attr) => attr.attributeID === eveData.attributeMapping?.chargeSize,
            )?.value ?? -1;
          if (filter.moduleWithCharge.chargeSize !== -1 && chargeSize !== filter.moduleWithCharge.chargeSize) continue;

          for (const chargeGroupID of filter.moduleWithCharge.chargeGroupIDs) {
            if (module.groupID !== chargeGroupID) continue;

            slotType = "charge";
            break;
          }

          if (slotType === undefined) continue;
        } else {
          slotType = "charge";
        }
      }

      if (search !== "" && !module.name.toLowerCase().includes(search.toLowerCase())) continue;

      const marketGroups: number[] = [];

      switch (module.metaGroupID) {
        case 3: // Storyline
        case 4: // Faction
          marketGroups.push(-1);
          break;

        case 5: // Officer
          marketGroups.push(-2);
          break;

        case 6: // Deadspace
          marketGroups.push(-3);
          break;
      }

      /* Construct the tree of the module's market groups. */
      let marketGroup: number | undefined = module.marketGroupID;
      while (marketGroup !== undefined) {
        marketGroups.push(marketGroup);
        marketGroup = eveData.marketGroups?.[marketGroup].parentGroupID;
      }

      /* Remove the root group. */
      marketGroups.pop();
      /* Put Drones and Structures in their own group. */
      if (module.categoryID === 18) marketGroups.push(157);
      if (module.categoryID === 66) marketGroups.push(477);

      /* Build up the tree till the find the leaf node. */
      let groupTree = module.categoryID === 8 ? newChargeGroups : newModuleGroups;
      for (const group of marketGroups.reverse()) {
        if (module.categoryID === 8 && filter.moduleWithCharge !== undefined && group >= 0) {
          continue;
        }

        if (groupTree.groups[group] === undefined) {
          let name;
          let meta;
          let iconID = undefined;
          switch (group) {
            case -1:
              name = "Faction & Storyline";
              iconID = 24146;
              meta = 3;
              break;

            case -2:
              name = "Officer";
              iconID = 24149;
              meta = 5;
              break;

            case -3:
              name = "Deadspace";
              iconID = 24148;
              meta = 6;
              break;

            default:
              name = eveData.marketGroups?.[group].name ?? "Unknown group";
              meta = 1;
              iconID = eveData.marketGroups?.[group].iconID;
              break;
          }

          groupTree.groups[group] = {
            name,
            meta,
            iconID,
            groups: {},
            items: [],
          };
        }

        groupTree = groupTree.groups[group];
      }

      groupTree.items.push({
        name: module.name,
        meta: module.metaGroupID ?? 0,
        typeId: parseInt(typeId),
        slotType,
      });
    }

    setModuleGroups(newModuleGroups);
    setChageGroups(newChargeGroups);
  }, [eveData, search, filter]);

  return (
    <div className={styles.listing}>
      <div className={styles.topbar}>
        <input type="text" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className={clsx(styles.filter, { [styles.collapsed]: selection !== "modules" })}>
        <span
          className={clsx({ [styles.selected]: filter.lowslot })}
          onClick={() => setFilter({ ...filter, lowslot: !filter.lowslot })}
        >
          <Icon name="fitting-lowslot" size={32} title="Filter: Low Slot" />
        </span>
        <span
          className={clsx({ [styles.selected]: filter.medslot })}
          onClick={() => setFilter({ ...filter, medslot: !filter.medslot })}
        >
          <Icon name="fitting-medslot" size={32} title="Filter: Mid Slot" />
        </span>
        <span
          className={clsx({ [styles.selected]: filter.hislot })}
          onClick={() => setFilter({ ...filter, hislot: !filter.hislot })}
        >
          <Icon name="fitting-hislot" size={32} title="Filter: High Slot" />
        </span>
        <span
          className={clsx({ [styles.selected]: filter.rig_subsystem })}
          onClick={() => setFilter({ ...filter, rig_subsystem: !filter.rig_subsystem })}
        >
          <Icon name="fitting-rig-subsystem" size={32} title="Filter: Rig & Subsystem Slots" />
        </span>
        <span
          className={clsx({ [styles.selected]: filter.drone })}
          onClick={() => setFilter({ ...filter, drone: !filter.drone })}
        >
          <Icon name="fitting-drones" size={32} title="Filter: Drones" />
        </span>
      </div>
      <div className={clsx(styles.filter, { [styles.collapsed]: selection !== "charges" })}>
        {Object.values(modulesWithCharges)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((chargeGroup) => {
            return (
              <span
                key={chargeGroup.typeId}
                className={clsx({ [styles.selected]: filter.moduleWithCharge?.typeId === chargeGroup.typeId })}
                onClick={() =>
                  setFilter({
                    ...filter,
                    moduleWithCharge: filter.moduleWithCharge?.typeId === chargeGroup.typeId ? undefined : chargeGroup,
                  })
                }
              >
                <img
                  src={`https://images.evetech.net/types/${chargeGroup.typeId}/icon?size=64`}
                  height={32}
                  width={32}
                  alt=""
                  className={styles.moduleChargeIcon}
                  title={chargeGroup.name}
                />
              </span>
            );
          })}
      </div>
      <div className={styles.selectionHeader}>
        <div onClick={() => setSelection("modules")} className={clsx({ [styles.selected]: selection === "modules" })}>
          Modules
        </div>
        <div onClick={() => setSelection("charges")} className={clsx({ [styles.selected]: selection === "charges" })}>
          Charges
        </div>
      </div>
      <div className={clsx(styles.listingContent, { [styles.collapsed]: selection !== "modules" })}>
        <ModuleGroup key="modules" level={0} group={moduleGroups} hideGroup={true} />
      </div>
      <div className={clsx(styles.listingContent, { [styles.collapsed]: selection !== "charges" })}>
        <ModuleGroup key="charges" level={0} group={chargeGroups} hideGroup={true} />
      </div>
    </div>
  );
};
