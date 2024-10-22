# web3-connect-react

Web3-connect-react is a React library for seamless blockchain wallet integration across multiple networks. 
It provides ready-made hooks and components for connecting popular wallets like MetaMask, OKX, Phantom, and WalletConnect, 
with support for custom wallet providers. 
The library simplifies Web3 interactions by managing wallet connections, network switching, and smart contract calls through a unified API. 
Just wrap your app with `WalletContextProvider` to access its complete functionality across your React components.


Online Demo: [https://web3-connect.pagepreview.dev](https://web3-connect.pagepreview.dev)

## Features

- Multiple chains support
- Multiple wallet support
  - MetaMask
  - OKX
  - Phantom
  - WalletConnect
  - Custom providers
- Smart contract interaction
- Network switching
- Send transactions
- Event listeners (on network change, on account change)

## Installation

```bash
  
pnpm install web3-connect-react
```

## Usage

Wrap your application with the `WalletContextProvider` and `EnvironmentProvider`.

```tsx
<EnvironmentProvider>
    <WalletContextProvider
        session={session}
        walletConnectConfig={WalletConnectConfig}
    >
        {children}
    </WalletContextProvider>
</EnvironmentProvider>
```


## Use the sdk

### Sign In
```tsx
import { useWallet } from "web3-connect-react";

const { signIn, isSignedIn } = useWallet();

await signIn(providerName, {
    onSignedIn: async (walletAddress, provider, session) => {
        sessionStorage.setItem("session", JSON.stringify(session));
        router.refresh();
    },
    getSignInData: async () => {},
});
```

### Sign Out
```tsx
import { useWallet } from "web3-connect-react";

const { signOut } = useWallet();

await signOut();
```

### Call a Contract
```tsx
import { useWallet } from "web3-connect-react";

const { sdk } = useWallet();

// deploy
const address = await sdk
    .deployContract({
        abi,
        bytecode,
    });

// call
const result = await sdk.callContractMethod({
    contractAddress,
    abi,
    method: "balanceOf",
    params: [walletAddress],
})
```

## Implementing a Custom Provider

Implementing a custom provider is straightforward; you simply need to extend the `BaseProvider` class. Below is an
illustrative example of a `MetaMaskProvider`.

```tsx
export class MetaMaskProvider extends BaseProvider {
    // MetaData is used to display information about the provider in the modal
    metadata: MetaData = {
        name: "MetaMask",
        image: <MetaMaskIcon/>,
        description:
            "Connect using a browser plugin or mobile app. Best supported on Chrome or Firefox.",
        displayName: "MetaMask",
        notInstalledText:
            "Dear friend, If you don't have a wallet yet, you can go to install MetaMask and create one now.",
        downloadLink: "https://metamask.io/",
    };

    // The rdns is used to identify the provider using the EIP-6963 event
    rdns: string = "io.metamask";

    constructor(globalWindow: any) {
        super(globalWindow);
    }

    init() {
        if (this.globalWindow === undefined) {
            return;
        }
        // get the provider from the EIP-6963 event
        this.globalWindow.addEventListener(
            "eip6963:announceProvider",
            (event: any) => {
                const eipEvent = event as EIP6963AnnounceProviderEvent;
                if (eipEvent.detail.info.rdns === this.rdns) {
                    this.provider = eipEvent.detail.provider;
                }
            }
        );
        this.globalWindow.dispatchEvent(new Event("eip6963:requestProvider"));
    }
}
```

## Testing

```bash
pnpm test
```


