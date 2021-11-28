package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"golang.org/x/oauth2"
)

var (
	dfxExecPath string
)

func init() {
	var err error
	if dfxExecPath, err = exec.LookPath("dfx"); err != nil {
		panic("Could not find the dfx canister sdk executable. Installation steps: https://sdk.dfinity.org")
	}
}

func call(dir string, subCmd string, args ...string) ([]byte, int, error) {
	cmd := exec.Cmd{
		Path: dfxExecPath,
		Args: append([]string{dfxExecPath, subCmd}, args...),
		Dir:  dir,
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		switch err := err.(type) {
		case *exec.ExitError:
			return out, err.ExitCode(), err
		default:
			return out, 0, err
		}
	}
	return out, 0, nil
}

func main() {
	cfg := &oauth2.Config{
		RedirectURL:  "http://localhost:3000/discord/callback",
		ClientID:     os.Getenv("CLIENT_ID"),
		ClientSecret: os.Getenv("CLIENT_SECRET"),
		Scopes:       []string{"identify"},
		Endpoint: oauth2.Endpoint{
			AuthURL:   "https://discord.com/api/oauth2/authorize",
			TokenURL:  "https://discord.com/api/oauth2/token",
			AuthStyle: oauth2.AuthStyleInParams,
		},
	}

	http.HandleFunc("/discord/", func(w http.ResponseWriter, r *http.Request) {
		oauthState := generateStateCookie(w)
		http.Redirect(w, r, cfg.AuthCodeURL(oauthState), http.StatusTemporaryRedirect)
	})

	http.HandleFunc("/discord/callback", func(w http.ResponseWriter, r *http.Request) {
		oauthState, _ := r.Cookie("oauthState")
		if r.FormValue("state") != oauthState.Value {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("State does not match."))
			return
		}
		token, err := cfg.Exchange(context.Background(), r.FormValue("code"))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		res, err := cfg.Client(context.Background(), token).Get("https://discord.com/api/users/@me")
		if err != nil || res.StatusCode != 200 {
			w.WriteHeader(http.StatusInternalServerError)
			if err != nil {
				w.Write([]byte(err.Error()))
			} else {
				w.Write([]byte(res.Status))
			}
			return
		}
		defer res.Body.Close()

		body, err := io.ReadAll(res.Body)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		var account DiscordAccount
		if err := json.Unmarshal(body, &account); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		raw, _, err := call("./accounts", "canister", []string{
			"--network=ic", "call", "accounts", "addDiscordAccount",
			fmt.Sprintf("(record { id=\"%s\"; username=\"%s\"; discriminator=\"%s\" })", account.ID, account.Username, account.Discriminator),
		}...)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write(raw)
			w.Write([]byte(err.Error()))
			return
		}
		key := strings.TrimSpace(string(raw))
		key = key[2 : len(key)-2]

		w.Write([]byte(fmt.Sprintf(`Hello %s#%s!
You can use the following key to link your principal: %s

$ dfx canister --network=ic --no-wallet call 45pum-byaaa-aaaam-aaanq-cai linkPrincipal "(\"%s\")"`,
			account.Username, account.Discriminator,
			key, key,
		)))
	})

	log.Println("Listening on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}

func generateStateCookie(w http.ResponseWriter) string {
	var expiration = time.Now().Add(365 * 24 * time.Hour)
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		log.Print(err)
	}
	state := base64.URLEncoding.EncodeToString(b)
	cookie := http.Cookie{
		Name:    "oauthState",
		Value:   state,
		Expires: expiration,
	}
	http.SetCookie(w, &cookie)
	return state
}

type DiscordAccount struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	Avatar        string `json:"avatar"`
	Discriminator string `json:"discriminator"`
	PublicFlags   int    `json:"public_flags"`
	Flags         int    `json:"flags"`
	Banner        string `json:"banner"`
	BannerColor   string `json:"banner_color"`
	AccentColor   int    `json:"accent_color"`
	Locale        string `json:"locale"`
	MfaEnabled    bool   `json:"mfa_enabled"`
	PremiumType   int    `json:"premium_type"`
}
