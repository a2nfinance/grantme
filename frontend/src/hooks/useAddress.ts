import { TESTNET_EXPLORER } from "@/core/config";

export const useAddress = () => {
    const getShortAddress = (address: string) => {
        return (
            address.slice(0,7).concat("....").concat(
                address.slice(address.length - 4, address.length)
            )
        )
    };

    const getContractExplorerURL = (address: string) => {
        return `${TESTNET_EXPLORER}/contract/${address}`;
    }

    const openLinkToExplorer = (address: string) => {
        window.open(getContractExplorerURL(address), '_blank');
    }
    
    return { getShortAddress, getContractExplorerURL, openLinkToExplorer };
};