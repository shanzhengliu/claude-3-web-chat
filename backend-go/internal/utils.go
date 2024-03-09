package internal

import (
	"encoding/json"
	"fmt"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

type TextContent struct {
	Content string `json:"content"`
	Type    string `json:"type"`
}

type ImageContent struct {
	Content string `json:"content"`
	Type    string `json:"type"`
	Source  Source `json:"source"`
}

type Source struct {
	Type      string `json:"type"`
	MediaType string `json:"media_type"`
	data      string `json:"data"`
}

type Body struct {
	Messages  json.RawMessage `json:"messages"`
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
}

type ResponseContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type Response struct {
	Type    string            `json:"type"`
	Role    string            `json:"role"`
	Content []ResponseContent `json:"content"`
}

func UiContextToRequestBody(uiContext string) []byte {

	requestBody := Body{Messages: json.RawMessage(uiContext), Model: "claude-3-opus-20240229", MaxTokens: 4096}

	jsonData, err := json.Marshal(requestBody)

	if err != nil {
		fmt.Printf("Error: %s", err.Error())
		jsonError, _ := json.Marshal(`{"error": "` + err.Error() + `"}`)
		return jsonError
	}

	return []byte(jsonData)
}

func ResponseToUiContext(responseBody string) []byte {
	body := []byte(responseBody)
	var response Response
	json.Unmarshal(body, &response)
	jsonData, _ := json.Marshal(response)
	return jsonData
}
