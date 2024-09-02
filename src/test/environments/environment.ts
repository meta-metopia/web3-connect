export interface Environment {
  isMobileDevice: boolean;
  globalWindow?: () => Promise<any>;
}
