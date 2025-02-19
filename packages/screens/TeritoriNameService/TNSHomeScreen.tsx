import React, { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";

import { TNSBurnNameScreen } from "./TNSBurnNameScreen";
import { TNSConsultNameScreen } from "./TNSConsultNameScreen";
import { TNSExploreScreen } from "./TNSExploreScreen";
import { TNSManageScreen } from "./TNSManageScreen";
import { TNSMintNameScreen } from "./TNSMintNameScreen";
import { TNSRegisterScreen } from "./TNSRegisterScreen";
import { TNSUpdateNameScreen } from "./TNSUpdateNameScreen";
import TNSBannerPNG from "../../../assets/banners/tns.png";
import exploreSVG from "../../../assets/icons/explore-neutral77.svg";
import penSVG from "../../../assets/icons/pen-neutral77.svg";
import registerSVG from "../../../assets/icons/register-neutral77.svg";
import useSelectedWallet from "../../hooks/useSelectedWallet";

import { BrandText } from "@/components/BrandText";
import { ImageBackgroundLogoText } from "@/components/ImageBackgroundLogoText";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { FlowCard } from "@/components/cards/FlowCard";
import { TNSNameFinderModal } from "@/components/modals/teritoriNameService/TNSNameFinderModal";
import { TNSCloseHandler, TNSItems, TNSModals } from "@/components/user/types";
import { useTNS } from "@/context/TNSProvider";
import { useWalletControl } from "@/context/WalletControlProvider";
import { useNSTokensByOwner } from "@/hooks/useNSTokensByOwner";
import { useSelectedNetworkId } from "@/hooks/useSelectedNetwork";
import {
  getCollectionId,
  getCosmosNetwork,
  NetworkFeature,
  NetworkKind,
} from "@/networks";
import { ScreenFC, useAppNavigation } from "@/utils/navigation";

const TNSPathMap = {
  TNSManage: "manage",
  TNSRegister: "register",
  TNSExplore: "explore",
  TNSConsultName: "consult-name",
  TNSMintName: "mint",
  TNSUpdateName: "update-name",
  TNSBurnName: "burn-name",
};

const LG_BREAKPOINT = 1600;
const MD_BREAKPOINT = 820;

export const TNSHomeScreen: ScreenFC<"TNSHome"> = ({ route }) => {
  const { width } = useWindowDimensions();

  const [modalNameFinderVisible, setModalNameFinderVisible] = useState(false);
  const [pressedTNSItems, setPressedTNSItems] = useState<TNSItems>();
  const [activeModal, setActiveModal] = useState<TNSModals>();
  const [navigateBackTo, setNavigateBackTo] = useState<TNSModals>();
  const { name, setName } = useTNS();
  const navigation = useAppNavigation();
  const selectedNetworkId = useSelectedNetworkId();
  const selectedNetwork = getCosmosNetwork(selectedNetworkId);
  const selectedWallet = useSelectedWallet();
  const { tokens } = useNSTokensByOwner(selectedWallet?.userId);
  const { showConnectWalletModal } = useWalletControl();
  const collectionId = getCollectionId(
    selectedNetwork?.id,
    selectedNetwork?.nameServiceContractAddress,
  );

  const handleModalClose: TNSCloseHandler = (
    modalName,
    navigateBackTo,
    _name = name,
  ) => {
    if (modalName) {
      navigation.navigate("TNSHome", {
        modal: TNSPathMap[modalName],
        name: _name,
      });
      setNavigateBackTo(navigateBackTo);
    } else {
      setName("");
      navigation.navigate("TNSHome", { modal: "" });
    }
  };

  const handleModalChange = (modal?: string, name?: string) => {
    if (!modal) {
      setActiveModal(undefined);
      setModalNameFinderVisible(false);
      return;
    }
    try {
      const routeName = Object.keys(TNSPathMap).find(
        // @ts-expect-error: description todo
        (key) => TNSPathMap[key] === modal,
      );

      if (["register", "explore"].includes(modal) && !name) {
        setModalNameFinderVisible(true);
        setPressedTNSItems(modal === "register" ? "TNSRegister" : "TNSExplore");
      } else {
        // @ts-expect-error: description todo
        setActiveModal(routeName);
        setModalNameFinderVisible(false);
      }
    } catch (err) {
      console.log("route path parsing failed", err);
    }
  };

  const onPressRegister = async () => {
    if (!selectedWallet?.address || !selectedWallet.connected) {
      showConnectWalletModal({
        forceNetworkFeature: NetworkFeature.NameService,
        action: "Register a Name",
      });
      return;
    }
    navigation.navigate("TNSHome", { modal: "register" });
  };

  useEffect(() => {
    handleModalChange(route.params?.modal, route.params?.name);
    if (route.params?.name) {
      setName(route.params.name);
    }
  }, [route, setName]);

  const tnsModalCommonProps = {
    onClose: handleModalClose,
    navigateBackTo,
  };

  return (
    <ScreenContainer
      headerChildren={<BrandText>Name Service</BrandText>}
      forceNetworkFeatures={[NetworkFeature.NameService]}
      forceNetworkKind={NetworkKind.Cosmos}
      isLarge
      responsive
    >
      <View>
        <ImageBackgroundLogoText
          text={`${selectedNetwork?.displayName} Name Service`}
          backgroundImage={TNSBannerPNG}
        />
        <View
          style={{
            marginVertical: width >= LG_BREAKPOINT ? 120 : 80,
            flexDirection: width >= MD_BREAKPOINT ? "row" : "column",
            justifyContent: "center",
          }}
        >
          <FlowCard
            label="Register"
            description="Register and configure a new name"
            iconSVG={registerSVG}
            onPress={onPressRegister}
          />
          <FlowCard
            label="Manage"
            description="Transfer, edit, or burn a name that you own"
            iconSVG={penSVG}
            onPress={() => navigation.navigate("TNSHome", { modal: "manage" })}
            style={{
              marginHorizontal: width >= MD_BREAKPOINT ? 12 : 0,
              marginVertical: width >= MD_BREAKPOINT ? 0 : 12,
            }}
            disabled={!tokens.length}
          />
          <FlowCard
            label="Explore"
            description="Lookup addresses and explore registered names"
            iconSVG={exploreSVG}
            onPress={() => navigation.navigate("TNSHome", { modal: "explore" })}
          />
        </View>

        <ActivityTable collectionId={collectionId} />

        <TNSNameFinderModal
          visible={modalNameFinderVisible}
          onClose={() => {
            setModalNameFinderVisible(false);
            navigation.navigate("TNSHome", { modal: "" });
          }}
          onEnter={() => {
            setModalNameFinderVisible(false);
            pressedTNSItems &&
              navigation.navigate("TNSHome", {
                modal: TNSPathMap[pressedTNSItems],
                name,
              });
          }}
        />
        {activeModal === "TNSManage" && (
          <TNSManageScreen {...tnsModalCommonProps} />
        )}
        {activeModal === "TNSExplore" && (
          <TNSExploreScreen {...tnsModalCommonProps} />
        )}
        {activeModal === "TNSRegister" && (
          <TNSRegisterScreen {...tnsModalCommonProps} />
        )}
        {activeModal === "TNSMintName" && (
          <TNSMintNameScreen {...tnsModalCommonProps} />
        )}
        {activeModal === "TNSConsultName" && (
          <TNSConsultNameScreen {...tnsModalCommonProps} />
        )}
        {activeModal === "TNSUpdateName" && (
          <TNSUpdateNameScreen {...tnsModalCommonProps} />
        )}
        {activeModal === "TNSBurnName" && (
          <TNSBurnNameScreen {...tnsModalCommonProps} />
        )}
      </View>
    </ScreenContainer>
  );
};
