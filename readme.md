# web3-connect-react

This repository provides support for the "Sign In With Ethereum" feature. To utilize this feature, you can incorporate
the following code snippet.

Among the components, `ModalContextProvider` is responsible for displaying modals, `EnvironmentProvider` is designed for
unit testing purposes, and `WalletContextProvider` is used to present the wallet modal.

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



## Testing

```bash
pnpm test
```
