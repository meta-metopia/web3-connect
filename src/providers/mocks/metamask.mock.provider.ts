import { MetaMaskProvider } from "../metamask";

export class MetaMaskMockProvider extends MetaMaskProvider {
  /**
   * Mock provider for MetaMask using rest api for its functionality
   * @param endpoint
   */
  constructor(endpoint: string) {
    super({} as any);
    this.provider = {
      on(): void {},
      request: (request: { method: string; params?: Array<any> }) => {
        // eslint-disable-next-line
        // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
        return new Promise(async (resolve, reject) => {
          try {
            fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(request),
            })
              .then(async (response) => {
                if (!response.ok) {
                  const json = await response.json();
                  reject(json);
                } else {
                  return response.json();
                }
              })
              .then((data) => {
                resolve(data.data);
              });
          } catch (e) {
            reject(e);
          }
        });
      },
    };
  }

  init() {}
}
