import "./App.css";
import useSWR from "swr";
import axios from "axios";
import * as constant from "./Constant";
import React, { startTransition, useEffect, useRef } from "react";
import * as marked from "marked";
import hljs from "highlight.js";
import * as cheerio from "cheerio";
import "highlight.js/styles/default.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [shouldFetch, setShouldFetch] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [cacheSave, setCacheSave] = React.useState(0);
  const [pageData, setPageData] = React.useState<{ role: string; pageData: string; type: string }[]>([]);
  const [renderData, setRenderData] = React.useState<
  {
    role: string;
    content: [
      | {
          source: {
            data: string | undefined | ArrayBuffer;
            media_type: string;
            type: string;
          };
          type: string;
        }
      | { text: string; type: string }
    ];
  }[]
>([]);

  useEffect(() => {

    const websitePassword = localStorage.getItem("website-password")||"";
    axios
      .post(constant.VITE_BACKEND_API_AUTH, undefined, {
        headers: { "website-password": websitePassword },
      })
      .then((res) => {
        if (res.status === 200) {
          setIsAuthenticated(true);
        }
      })
      .catch((err) => {
        console.log(err);
      }); 
    

    setRenderData(JSON.parse(localStorage.getItem("renderData")||"[]"));
    setPageData(JSON.parse(localStorage.getItem("pageData") || "[]"));   
   }, []);


  useEffect(() => {
    if(cacheSave === 0) return;
      localStorage.setItem("renderData", JSON.stringify(renderData));
      localStorage.setItem("pageData", JSON.stringify(pageData));
  }, [ cacheSave,renderData, pageData]);

  const [isComposing, setIsComposing] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [password, setPassword] = React.useState("");
  const handleInputChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInput(event.target.value);
  };

  const handleMessage = async (value: any): Promise<string> => {
    const htmltext = await marked.parse(value);
    const $ = cheerio.load(htmltext);
    $("code").each(function (_, elem) {
      const classes = $(elem).attr("class"); // 获取class属性的值
      if (classes) {
        const languageMatch = classes.match(/language-(\w+)/);
        if (languageMatch !== null && hljs.getLanguage(languageMatch[1])) {
          const codeContent = $(elem).text();

          const highlightedCode = hljs.highlight(codeContent, {
            language: languageMatch[1],
          }).value;

          $(elem).html(highlightedCode);

          $(elem).addClass("hljs");
        }
      }
    });
    return $.html();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    //don't know why is empty
    const tempPageData = pageData||[];
    if (
      renderData[renderData.length - 1]?.role === "user" &&
      renderData[renderData.length - 1]?.content[0]?.type === "image"
    ) {
      const lastRenderData = renderData[renderData.length - 1];
      lastRenderData.content.push({ text: input, type: "text" });
    } else {
      setRenderData([
        ...renderData,
        { role: "user", content: [{ text: input, type: "text" }] },
      ]);
    }

    setPageData([
      ...tempPageData,
      { role: "user", pageData: await handleMessage(input), type: "text" },
    ]);
    setInput("");
    setLoading(true);
    startTransition(() => {
      setShouldFetch(true);
    });
  };

  const fetcher = async (url: string) => {
    const websitePassword = localStorage.getItem("website-password");
    return await axios
      .post(url, renderData, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
          "website-password": websitePassword,
        },
      })
      .then(async (res) => {
       setRenderData([
          ...renderData,
          {
            role: "assistant",
            content: [{ text: res.data.content[0].text, type: "text" }],
          },
        ]);
        setPageData([
          ...pageData,
          {
            role: "assistant",
            pageData: await handleMessage(res.data.content[0].text),
            type: "text",
          },
        ]);
        setCacheSave(cacheSave + 1);
        setShouldFetch(false);
        setLoading(false);
        return res.data;
      })
      .catch(async (err) => {
        setShouldFetch(false);
        setLoading(false);
        setRenderData([
          ...renderData,
          {
            role: "assistant",
            content: [
              {
                text: "INTERNAL ERROR, MAYBE API KEY IS INCORRECT OR WEBSITE PASSWORD INCORECT",
                type: "text",
              },
            ],
          },
        ]);
        setPageData([
          ...pageData,
          {
            role: "assistant",
            pageData: await handleMessage(
              "INTERNAL ERROR, MAYBE API KEY IS INCORRECT OR WEBSITE PASSWORD INCORECT"
            ),
            type: "text",
          },
        ]);
        setCacheSave(cacheSave + 1);
        return err;
      });
  };

  const clearData = () => {
    setPageData([]);
    setRenderData([]);
    setCacheSave(cacheSave + 1);
  };

  const handleKeyDown = (e: {
    key: string;
    shiftKey: any;
    preventDefault: () => void;
  }) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("File size should be less than 3MB");
      return;
    }

    if (
      renderData[renderData.length - 1]?.role === "user" &&
      renderData[renderData.length - 1]?.content[0]?.type === "image"
    ) {
      alert("you can't send image after image");
      return;
    }
    const extendsionMap: { [key: string]: string } = {
      jpg: "jpeg",
      jpeg: "jpeg",
      png: "png",
      gif: "gif",
    };
    const reader = new FileReader();
    reader.onload = async () => {
      const fileExtension = file.name.split(".").pop();
      setPageData([
        ...pageData,
        {
          role: "user",
          pageData: await handleMessage(`<img src="${reader.result}"></img>`),
          type: "text",
        },
      ]);
      setRenderData([
        ...renderData,
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                data: (reader.result as string).replace(
                  `data:image/${extendsionMap[fileExtension]};base64,`,
                  ""
                ),
                media_type: `image/${extendsionMap[fileExtension]}`,
              },
            },
          ],
        },
      ]);
    };
    setCacheSave(cacheSave + 1);
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useSWR(shouldFetch ? constant.VITE_BACKEND_API_CALL : null, fetcher);

  return (
    <div>
      {!isAuthenticated ? (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Website Password</h2>
            <div className="mb-4">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                axios
                  .post(constant.VITE_BACKEND_API_AUTH, undefined, {
                    headers: { "website-password": password },
                  })
                  .then((res) => {
                    if (res.status === 200) {
                      localStorage.setItem("website-password", password);
                      setIsAuthenticated(true);
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    alert("wrong password");
                  });
              }}
            >
              Login
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div className="bg-gray-100 h-screen p-4">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
              <div className="p-4 space-y-2 overflow-y-auto flex-grow">
                {pageData &&
                  pageData.map((item: any, index) => (
                    <div key={index}>
                      {item.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="bg-blue-500 text-white rounded-l-lg rounded-t-lg px-4 py-2 max-w-xl">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: item.pageData,
                              }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <div className="bg-gray-200 rounded-r-lg rounded-t-lg px-4 py-2 max-w-xl">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: item.pageData,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 rounded-r-lg rounded-t-lg px-4 py-2 max-w-xl">
                      AI is thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t p-4">
                <div className="flex justify-start space-x-2 mb-2">
                  <button
                    onClick={triggerFileInput}
                    className="px-1 py-0.5 text-white bg-green-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Image
                  </button>
                  <button
                    onClick={() => {
                      clearData();
                    }}
                    className="px-1 py-0.5 text-white bg-green-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <textarea
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={handleKeyDown}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="resize-none w-full p-2 rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  />
                  <button
                    onClick={() => {
                      handleSend();
                    }}
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-12 ml-2"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
