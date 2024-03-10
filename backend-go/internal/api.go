package internal

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func WebsitePasswordVerify(r *http.Request) bool {
	ctxMap := r.Context().Value("map").(map[string]interface{})
	websitePassword := ctxMap["websitePassword"].(string)
	if websitePassword == "" {
		return true
	}
	return r.Header.Get("website-password") == websitePassword
}

func ApiCall(w http.ResponseWriter, r *http.Request) {
	if !WebsitePasswordVerify(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	ctxMap := r.Context().Value("map").(map[string]interface{})
	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	url := "https://api.anthropic.com/v1/messages"

	request, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(UiContextToRequestBody(string(requestBody)))))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("anthropic-version", "2023-06-01")
	request.Header.Set("x-api-key", ctxMap["apikey"].(string))

	if err != nil {
		fmt.Printf("An Error Occured %v", err)
		return
	}

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		fmt.Printf("An Error Occured %v", err)
		return
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		fmt.Printf("An Error Occured %v", err)
		return
	}
	if response.StatusCode != 200 {
		fmt.Printf("An Error Occured %v", responseBody)
		return
	}
	w.Write(ResponseToUiContext(string(responseBody)))

}
