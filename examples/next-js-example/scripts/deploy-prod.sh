pnpm i && pnpm vercel pull --yes --token=$VERCEL_TOKEN && pnpm vercel build --prod
URL="$(pnpm vercel --prebuilt --prod --token=$VERCEL_TOKEN --scope=$SCOPE)"
if [ ! -z "$PREVIEW_URL" ]; then
    vercel alias set "$URL" $PREVIEW_URL --scope=$SCOPE --token=$VERCEL_TOKEN
fi
