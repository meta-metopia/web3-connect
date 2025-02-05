pnpm i && pnpm vercel pull --yes --token=$VERCEL_TOKEN && pnpm vercel build
URL="$(pnpm vercel --prebuilt --token=$VERCEL_TOKEN --scope=$SCOPE)"
pnpm vercel alias set "$URL" $PREVIEW_URL --scope=$SCOPE --token=$VERCEL_TOKEN
