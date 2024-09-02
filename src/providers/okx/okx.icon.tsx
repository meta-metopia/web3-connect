interface Props {
  className?: string;
}

export function OKXWalletIcon({ className }: Props) {
  return (
    // biome-ignore lint/a11y/useAltText: <explanation>
    <img
      src="https://static.okx.com/cdn/assets/imgs/221/B1041DB14722953A.png"
      className={className}
      style={{
        objectFit: "contain",
        height: "100%",
        width: "100%",
      }}
    />
  );
}
