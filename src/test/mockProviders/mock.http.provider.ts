import { ethers } from "ethers";

export interface Network {
  chainId: number | string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

interface Props {
  privateKey: string;
  networkList: Network[];
}

export class MockHttpProvider {
  wallet: ethers.Wallet;
  private balance: string;
  public networkList: Network[];
  currentNetwork: Network;

  constructor(private readonly props: Props) {
    this.wallet = new ethers.Wallet(props.privateKey);
    this.balance = "0x0";
    this.networkList = props.networkList;
    this.currentNetwork = props.networkList[0];
  }

  addNetwork(network: Network) {
    this.networkList.push(network);
  }

  /**
   * Update the balance of the wallet from ethers
   * @param balance
   */
  updateBalance(balance: string) {
    this.balance = "0x" + ethers.parseEther(balance).toString(16);
  }

  // eslint-disable-next-line
  async request(method: string, params: any[]) {
    switch (method) {
      case "eth_accounts":
        return [this.wallet.address];
      case "eth_getBalance":
        return this.balance;
      case "eth_chainId":
        if (typeof this.currentNetwork.chainId !== "number") {
          return this.currentNetwork.chainId;
        }
        return "0x" + this.currentNetwork.chainId.toString(16);
      case "personal_sign":
        const message = params?.[0];
        return this.wallet.signMessage(ethers.getBytes(message));
      case "wallet_addEthereumChain":
        const network = params?.[0];
        this.addNetwork(network);
        return null;
      case "wallet_switchEthereumChain":
        const chainId = params?.[0].chainId;
        const network1 = this.networkList.find(
          (network) => network.chainId === chainId,
        );
        if (!network1) {
          throw new Error("Network not found");
        }
        this.currentNetwork = network1;
        break;
      case "eth_requestAccounts":
        return [this.wallet.address];
      default:
        throw new Error(`Method ${method} not implemented`);
    }
  }
}
