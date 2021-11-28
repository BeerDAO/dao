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

	"github.com/dghubble/oauth1"
	"github.com/dghubble/oauth1/twitter"
	"github.com/joho/godotenv"
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
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	discordCfg := &oauth2.Config{
		RedirectURL:  "http://localhost:3000/discord/callback",
		ClientID:     os.Getenv("DISCORD_CLIENT_ID"),
		ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
		Scopes:       []string{"identify"},
		Endpoint: oauth2.Endpoint{
			AuthURL:   "https://discord.com/api/oauth2/authorize",
			TokenURL:  "https://discord.com/api/oauth2/token",
			AuthStyle: oauth2.AuthStyleInParams,
		},
	}

	twitterCfg := oauth1.Config{
		ConsumerKey:    os.Getenv("TWITTER_API_KEY"),
		ConsumerSecret: os.Getenv("TWITTER_API_SECRET"),
		CallbackURL:    "http://localhost:3000/twitter/callback",
		Endpoint:       twitter.AuthorizeEndpoint,
	}

	http.HandleFunc("/discord/", func(rw http.ResponseWriter, r *http.Request) {
		oauthState := generateStateCookie(rw, "discord")
		http.Redirect(rw, r, discordCfg.AuthCodeURL(oauthState), http.StatusTemporaryRedirect)
	})

	http.HandleFunc("/twitter/", func(rw http.ResponseWriter, r *http.Request) {
		requestToken, _, _ := twitterCfg.RequestToken()
		authorizationURL, _ := twitterCfg.AuthorizationURL(requestToken)
		http.Redirect(rw, r, authorizationURL.String(), http.StatusTemporaryRedirect)
	})

	http.HandleFunc("/discord/callback", func(rw http.ResponseWriter, r *http.Request) {
		oauthState, _ := r.Cookie("discord_oauthState")
		if r.FormValue("state") != oauthState.Value {
			rw.WriteHeader(http.StatusBadRequest)
			rw.Write([]byte("State does not match."))
			return
		}
		token, err := discordCfg.Exchange(context.Background(), r.FormValue("code"))
		if err != nil {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(err.Error()))
			return
		}

		res, err := discordCfg.Client(context.Background(), token).Get("https://discord.com/api/users/@me")
		if err != nil || res.StatusCode != 200 {
			rw.WriteHeader(http.StatusInternalServerError)
			if err != nil {
				rw.Write([]byte(err.Error()))
			} else {
				rw.Write([]byte(res.Status))
			}
			return
		}
		defer res.Body.Close()

		body, err := io.ReadAll(res.Body)
		if err != nil {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(err.Error()))
			return
		}
		var account DiscordAccount
		if err := json.Unmarshal(body, &account); err != nil {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(err.Error()))
			return
		}

		raw, _, err := call(".", "canister", []string{
			"--network=ic", "call", "accounts", "addDiscordAccount",
			fmt.Sprintf("(record { id=\"%s\"; username=\"%s\"; discriminator=\"%s\" })", account.ID, account.Username, account.Discriminator),
		}...)
		if err != nil {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write(raw)
			rw.Write([]byte(err.Error()))
			return
		}
		key := strings.TrimSpace(string(raw))
		key = key[2 : len(key)-2]

		rw.Write([]byte(fmt.Sprintf(`Hello %s#%s!
You can use the following key to link your principal: %s

$ dfx canister --network=ic --no-wallet call 45pum-byaaa-aaaam-aaanq-cai linkPrincipal "(\"%s\")"`,
			account.Username, account.Discriminator,
			key, key,
		)))
	})

	http.HandleFunc("/twitter/callback", func(rw http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		token := q["oauth_token"][0]
		verifier := q["oauth_verifier"][0]
		accessToken, accessSecret, _ := twitterCfg.AccessToken(token, "", verifier)
		rw.Write([]byte(fmt.Sprintf("Access Token: %s\nAccess Secret: %s\n", accessToken, accessSecret)))
	})

	log.Println("Listening on http://localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}

func generateStateCookie(w http.ResponseWriter, prefix string) string {
	var expiration = time.Now().Add(365 * 24 * time.Hour)
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		log.Print(err)
	}
	state := base64.URLEncoding.EncodeToString(b)
	cookie := http.Cookie{
		Name:    fmt.Sprintf("%s_oauthState", prefix),
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
