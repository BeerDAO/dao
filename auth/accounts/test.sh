#!/usr/bin/env sh

echo "| Starting replica."
dfx start --background --clean > /dev/null 2>&1
dfx deploy --no-wallet

id="$(dfx identity get-principal)"
e=$(dfx canister --no-wallet call accounts addDiscordAccount "(record { id=\"0123456789\"; userName=\"test\"; discriminator=\"0001\" })")
dfx canister --no-wallet call accounts linkPrincipal "${e}"

dfx -q stop > /dev/null 2>&1